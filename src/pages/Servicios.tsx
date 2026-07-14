import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Pencil, Trash2, Scissors, Clock, Sparkles, Upload } from "lucide-react";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";

export default function Servicios() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    price: "",
    duration: "30",
    category: "",
    isActive: true,
  });

  const { data: services, isLoading } = trpc.service.list.useQuery(
    search ? { search } : undefined
  );

  const { data: user } = trpc.auth.me.useQuery();

  const bulkCreateMutation = trpc.service.bulkCreate.useMutation({
    onSuccess: (count) => {
      utils.service.list.invalidate();
      toast({ title: `¡Importados ${count} servicios! ✨` });
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
          duration: row.durationMinutes || row.duration,
          isActive: row.active === 'true' || row.active === '1'
        }));
        if(confirm(`¿Estás seguro de importar ${data.length} servicios?`)) {
          bulkCreateMutation.mutate(data);
        }
        e.target.value = ''; // reset
      }
    });
  }

  const createMutation = trpc.service.create.useMutation({
    onSuccess: () => {
      utils.service.list.invalidate();
      setDialogOpen(false);
      resetForm();
      toast({ title: "¡Servicio creado! 🌸" });
    },
  });

  const updateMutation = trpc.service.update.useMutation({
    onSuccess: () => {
      utils.service.list.invalidate();
      setDialogOpen(false);
      resetForm();
      toast({ title: "Servicio actualizado ✨" });
    },
  });

  const deleteMutation = trpc.service.delete.useMutation({
    onSuccess: () => {
      utils.service.list.invalidate();
      toast({ title: "Servicio eliminado" });
    },
  });

  function resetForm() {
    setForm({ name: "", description: "", price: "", duration: "30", category: "", isActive: true });
    setEditingId(null);
  }

  function handleEdit(service: any) {
    if (!service) return;
    setEditingId(service.id);
    setForm({
      name: service.name || "",
      description: service.description || "",
      price: Math.floor(Number(service.price) || 0).toString(),
      duration: service.duration ? service.duration.toString() : "30",
      category: service.category || "",
      isActive: service.isActive === 1 || service.isActive === true,
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { ...form, price: String(Math.floor(Number(form.price) || 0)), duration: Number(form.duration) || 30 };
    if (editingId) updateMutation.mutate({ id: editingId, ...data });
    else createMutation.mutate(data);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Catálogo de Servicios</h1>
          <p className="text-xs md:text-sm text-muted-foreground font-medium italic">Catálogo de tratamientos y belleza</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 font-black shadow-lg h-12 w-full md:w-auto px-8 rounded-2xl">
              <Plus className="h-5 w-5 mr-2" /> NUEVO SERVICIO
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
            <DialogHeader><DialogTitle className="font-black text-primary uppercase">Nuevo Servicio</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Nombre del Servicio *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Corte de Cabello" className="rounded-xl" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase">Precio ($) *</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" className="rounded-xl" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase">Duración (Min) *</Label>
                  <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="rounded-xl" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Categoría</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Peluquería" className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full bg-primary font-black h-12 shadow-xl rounded-2xl mt-4 uppercase">
                {editingId ? "Actualizar" : "Crear Servicio"} ✨
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
        <Input placeholder="Buscar servicios..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-12 rounded-xl border-border bg-card" />
      </div>

      {/* VISTA DE TABLA DE DATOS */}
      <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-5 rounded-tl-[2rem]">Servicio</th>
                <th className="px-6 py-5">Categoría</th>
                <th className="px-6 py-5 text-center">Duración</th>
                <th className="px-6 py-5 text-right">Precio</th>
                <th className="px-6 py-5 text-right rounded-tr-[2rem]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {isLoading ? (
                <tr><td colSpan={5} className="p-6"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>
              ) : services?.map(service => (
                <tr key={service.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Scissors className="h-4 w-4" />
                      </div>
                      <p className="font-black text-primary uppercase text-xs">{service.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                      <Sparkles className="h-3 w-3 text-primary" /> {service.category || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-slate-100 rounded-md text-[10px] font-black text-slate-600 ring-1 ring-slate-200">
                      <Clock className="h-3 w-3 mr-1" /> {service.duration} min
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="font-black text-slate-800">${Math.floor(Number(service.price)).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(service)} className="h-9 w-9 text-primary hover:bg-primary/10 rounded-lg border border-primary/10"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if(confirm("¿Eliminar?")) deleteMutation.mutate(service.id) }} className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-lg border border-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {services?.length === 0 && !isLoading && (
            <div className="p-10 text-center text-muted-foreground text-xs font-black uppercase tracking-widest italic">No se encontraron servicios</div>
          )}
        </div>
      </div>
    </div>
  );
}
