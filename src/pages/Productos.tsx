import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  ChevronRight,
  Tags,
  Hash,
  Box,
  Sparkles,
  Upload,
} from "lucide-react";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Productos() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    sku: "",
    price: "",
    stock: "",
    minStock: "",
    category: "",
    isActive: true,
  });

  const { data: user } = trpc.auth.me.useQuery();

  const bulkCreateMutation = trpc.product.bulkCreate.useMutation({
    onSuccess: (count) => {
      utils.product.list.invalidate();
      toast({ title: `¡Importados ${count} productos! ✨` });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map((row: any) => ({
          name: row.name,
          category: row.category,
          price: row.price,
          stock: row.stock,
          isActive: row.active === 'true' || row.active === '1'
        }));
        if(confirm(`¿Estás seguro de importar ${data.length} productos?`)) {
          bulkCreateMutation.mutate(data);
        }
        e.target.value = ''; // reset
      }
    });
  }

  const { data: products, isLoading } = trpc.product.list.useQuery(
    activeTab === "low" ? { lowStock: true } : search ? { search } : undefined
  );

  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      setDialogOpen(false);
      resetForm();
      toast({ title: "¡Producto creado! 🌸" });
    },
  });

  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      setDialogOpen(false);
      resetForm();
      toast({ title: "Producto actualizado ✨" });
    },
  });

  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      toast({ title: "Producto eliminado" });
    },
  });

  function resetForm() {
    setForm({ name: "", description: "", sku: "", price: "", stock: "", minStock: "5", category: "", isActive: true });
    setEditingId(null);
  }

  function handleEdit(product: any) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      sku: product.sku || "",
      price: Math.floor(Number(product.price)).toString(),
      stock: product.stock.toString(),
      minStock: product.minStock.toString(),
      category: product.category || "",
      isActive: product.isActive === 1 || product.isActive === true,
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...form, stock: Number(form.stock) || 0, minStock: Number(form.minStock) || 0 };
    if (editingId) updateMutation.mutate({ id: editingId, ...data });
    else createMutation.mutate(data);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Inventario</h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium italic">Gestión masiva de productos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 font-black shadow-lg h-12 w-full md:w-auto px-8 rounded-2xl">
              <Plus className="h-5 w-5 mr-2" /> NUEVO PRODUCTO
            </Button>
          </DialogTrigger>
          {user?.role === "admin_pro" && (
            <div className="relative inline-block w-full md:w-auto">
              <Input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={handleFileUpload} />
              <Button variant="outline" className="h-12 border-dashed border-2 px-8 font-black rounded-2xl w-full text-primary border-primary/20 hover:bg-primary/5">
                <Upload className="h-5 w-5 mr-2" /> IMPORTAR CSV
              </Button>
            </div>
          )}
          <DialogContent className="max-w-md w-[95vw] rounded-3xl">
            <DialogHeader><DialogTitle className="font-black text-primary uppercase">Registro de Producto</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-primary/60">Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Shampoo Keratina" className="rounded-xl border-primary/10" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-primary/60">Precio ($) *</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl border-primary/10" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-primary/60">Stock *</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-xl border-primary/10" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-primary/60">SKU / Código</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="rounded-xl border-primary/10" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-primary/60">Categoría</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl border-primary/10" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary font-black h-12 shadow-xl rounded-2xl mt-4 uppercase">
                {editingId ? "Actualizar" : "Crear Producto"} ✨
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
          <Input placeholder="Buscar por nombre o SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-12 rounded-xl border-border bg-card" />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-muted p-1 h-12 rounded-xl w-full grid grid-cols-2 border border-border">
            <TabsTrigger value="all" className="rounded-lg font-semibold text-xs uppercase data-[state=active]:bg-card">TODOS</TabsTrigger>
            <TabsTrigger value="low" className="rounded-lg font-semibold text-xs uppercase flex items-center gap-1 text-destructive data-[state=active]:bg-card"><AlertTriangle className="h-3 w-3" /> STOCK BAJO</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* VISTA DE TABLA DE DATOS */}
      <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-5 rounded-tl-[2rem]">Producto / SKU</th>
                <th className="px-6 py-5">Categoría</th>
                <th className="px-6 py-5 text-center">Precio</th>
                <th className="px-6 py-5 text-center">Stock</th>
                <th className="px-6 py-5 text-right rounded-tr-[2rem]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {isLoading ? (
                <tr><td colSpan={5} className="p-6"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>
              ) : products?.map(product => {
                const isLow = product.stock <= product.minStock;
                return (
                  <tr key={product.id} className={`hover:bg-primary/5 transition-colors group ${isLow ? 'bg-destructive/5' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border-2 ${isLow ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-primary/10 border-primary/10 text-primary'}`}>
                          <Box className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-foreground uppercase text-xs">{product.name}</p>
                          {product.sku && <p className="text-[9px] font-black text-muted-foreground mt-0.5 tracking-widest">{product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1 bg-muted px-3 py-1 rounded-full border border-border">
                        <Sparkles className="h-3 w-3 text-primary" /> {product.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="font-black text-foreground">${Math.floor(Number(product.price)).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-md text-[10px] font-black ${isLow ? 'bg-destructive/10 text-destructive ring-1 ring-destructive/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} className="h-9 w-9 text-primary hover:bg-primary/10 rounded-lg border border-primary/10"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if(confirm("¿Eliminar?")) deleteMutation.mutate(product.id) }} className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-lg border border-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {products?.length === 0 && !isLoading && (
            <div className="p-10 text-center text-muted-foreground text-xs font-black uppercase tracking-widest italic">No se encontraron productos</div>
          )}
        </div>
      </div>
    </div>
  );
}
