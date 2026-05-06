import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Plus, Trash2, Save, UserPlus, FileText, Calculator, PackagePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Compras() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [rut, setRut] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([]);
  
  // Totales
  const [netAmount, setNetAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Queries
  const { data: suppliers } = trpc.purchase.listSuppliers.useQuery();
  const { data: purchaseList } = trpc.purchase.listPurchases.useQuery();
  const { data: products } = trpc.product.list.useQuery({ active: true });

  // Mutations
  const createSupplier = trpc.purchase.createSupplier.useMutation({
    onSuccess: (newSupplier) => {
      utils.purchase.listSuppliers.invalidate();
      if (newSupplier) {
        setSupplierId(newSupplier.id.toString());
        setRut(newSupplier.rut || "");
      }
      toast({ title: "Proveedor creado y seleccionado ✨" });
    }
  });

  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      toast({ title: "Producto creado ✨" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const createPurchase = trpc.purchase.createPurchase.useMutation({
    onSuccess: () => {
      utils.purchase.listPurchases.invalidate();
      utils.product.list.invalidate();
      toast({ title: "Factura ingresada OK ✨" });
      resetForm();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, costPrice: 0, salePrice: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    calculateTotals(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
    calculateTotals(newItems);
  };

  const calculateTotals = (currentItems: any[]) => {
    const totalCost = currentItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.costPrice)), 0);
    setNetAmount(totalCost);
    setTaxAmount(totalCost * 0.19);
    setTotalAmount(totalCost * 1.19);
  };

  const resetForm = () => {
    setSupplierId("");
    setInvoiceNumber("");
    setRut("");
    setNotes("");
    setItems([]);
    setNetAmount(0);
    setTaxAmount(0);
    setTotalAmount(0);
  };

  const handleSave = () => {
    console.log("[DEBUG] Intentando guardar factura:", { supplierId, invoiceNumber, totalAmount });
    
    if (!supplierId) {
      toast({ title: "Faltan datos", description: "Por favor, selecciona un proveedor.", variant: "destructive" });
      return;
    }
    if (!invoiceNumber) {
      toast({ title: "Faltan datos", description: "Por favor, ingresa el número de factura.", variant: "destructive" });
      return;
    }
    if (!totalAmount || totalAmount <= 0) {
      toast({ title: "Faltan datos", description: "El monto total debe ser mayor a 0.", variant: "destructive" });
      return;
    }

    createPurchase.mutate({
      supplierId: Number(supplierId),
      invoiceNumber,
      rut,
      netAmount,
      taxAmount,
      totalAmount,
      notes,
      purchaseDate,
      items: [] // Sin productos, solo cabecera
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter uppercase flex items-center gap-3">
            Ingreso de Facturas <ShoppingBag className="h-8 w-8" />
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Gestión de proveedores e historial de documentos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* CABECERA FACTURA */}
        <Card className="lg:col-span-2 border-2 border-primary/10 shadow-2xl rounded-[2.5rem] bg-admin-panel overflow-hidden">
          <CardHeader className="border-b border-border px-8 py-5">
          <CardTitle className="font-bold text-foreground flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" /> Datos del Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-medium text-muted-foreground uppercase ml-1">Proveedor</Label>
                <div className="flex gap-2">
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger className="rounded-xl border border-border h-12 bg-card text-foreground focus:border-primary transition-all">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {suppliers?.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.rut})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-12 w-12 rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                        <UserPlus className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] border-2 border-primary/20 bg-card shadow-2xl max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="font-black text-primary uppercase flex items-center gap-2"><UserPlus className="h-6 w-6" /> Nuevo Proveedor</DialogTitle>
                      </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-medium text-muted-foreground uppercase">Razón Social</Label>
                             <Input id="s-name" placeholder="Ej: Distribuidora Belleza S.A." className="rounded-xl border border-border bg-card h-12 text-foreground" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-medium text-muted-foreground uppercase">Nombre Contacto</Label>
                               <Input id="s-contact" placeholder="Juan Pérez" className="rounded-xl border border-border bg-card h-12 text-foreground" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-medium text-muted-foreground uppercase">RUT</Label>
                               <Input id="s-rut" placeholder="77.777.777-7" className="rounded-xl border border-border bg-card h-12 text-foreground" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-medium text-muted-foreground uppercase">Fono</Label>
                               <Input id="s-phone" placeholder="+56 9 ..." className="rounded-xl border border-border bg-card h-12 text-foreground" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-medium text-muted-foreground uppercase">Mail</Label>
                               <Input id="s-email" type="email" placeholder="contacto@proveedor.com" className="rounded-xl border border-border bg-card h-12 text-foreground" />
                            </div>
                          </div>
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90 font-black h-14 rounded-2xl shadow-xl shadow-primary/20 uppercase text-white"
                            onClick={async () => {
                              const nameInput = document.getElementById('s-name') as HTMLInputElement;
                              const contactInput = document.getElementById('s-contact') as HTMLInputElement;
                              const rutInput = document.getElementById('s-rut') as HTMLInputElement;
                              const phoneInput = document.getElementById('s-phone') as HTMLInputElement;
                              const emailInput = document.getElementById('s-email') as HTMLInputElement;

                              if (nameInput.value) {
                                await createSupplier.mutateAsync({ 
                                  name: nameInput.value, 
                                  contactName: contactInput.value,
                                  rut: rutInput.value,
                                  phone: phoneInput.value,
                                  email: emailInput.value
                                });
                                // Limpiamos campos
                                nameInput.value = "";
                                contactInput.value = "";
                                rutInput.value = "";
                                phoneInput.value = "";
                                emailInput.value = "";
                              }
                            }}
                          >
                            {createSupplier.isPending ? "Creando..." : "Crear Proveedor ✨"}
                          </Button>
                        </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-medium text-muted-foreground uppercase ml-1">Nº Factura</Label>
                <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="000123" className="rounded-xl border border-border h-12 bg-card text-foreground focus:border-primary transition-all" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-medium text-muted-foreground uppercase ml-1">RUT Factura</Label>
                <Input value={rut} onChange={e => setRut(e.target.value)} placeholder="76.000.000-K" className="rounded-xl border border-border h-12 bg-card text-foreground focus:border-primary transition-all" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase text-slate-900 ml-1">Fecha de Compra</Label>
                <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="rounded-xl border border-border h-12 bg-card text-foreground focus:border-primary transition-all" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-[10px] font-medium text-muted-foreground uppercase ml-1">Detalle / Notas de la Factura</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Insumos mes de mayo, tinturas varias..." className="rounded-xl border border-border h-12 bg-card text-foreground focus:border-primary transition-all" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RESUMEN TOTALES */}
        <Card className="border border-border shadow-xl rounded-2xl bg-card overflow-hidden">
          <CardHeader className="border-b border-border px-6 py-5">
            <CardTitle className="font-bold text-foreground flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5 text-primary" /> Resumen de Cobro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Monto Neto</span>
              <Input 
                type="number" 
                value={netAmount} 
                onChange={e => {
                  const net = Number(e.target.value);
                  setNetAmount(net);
                  setTaxAmount(Math.round(net * 0.19));
                  setTotalAmount(Math.round(net * 1.19));
                }}
                placeholder="0"
                className="bg-muted border-border text-foreground font-black text-2xl h-14 rounded-xl focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex justify-between items-center border-b border-border pb-4">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">IVA (19%)</span>
              <span className="text-xl font-black text-foreground">${taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground text-sm uppercase tracking-widest">Total Factura</span>
              <span className="text-3xl font-black text-primary">${totalAmount.toLocaleString()}</span>
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-13 rounded-xl shadow-lg uppercase mt-4 group"
              onClick={handleSave}
              disabled={createPurchase.isPending}
            >
              {createPurchase.isPending ? "Procesando..." : <><Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" /> INGRESAR FACTURA ✨</>}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* HISTORIAL DE FACTURAS */}
      <Card className="border-2 border-primary/10 shadow-2xl rounded-[2.5rem] bg-admin-panel overflow-hidden">
        <CardHeader className="border-b border-border px-8 py-6">
          <CardTitle className="font-bold text-foreground flex items-center gap-2 text-base tracking-tight">
            <FileText className="h-5 w-5 text-primary" /> Historial de Facturas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted text-[10px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-border">
                <tr>
                  <th className="px-6 py-5">Fecha</th>
                  <th className="px-6 py-5">Nº Factura</th>
                  <th className="px-6 py-5">Proveedor</th>
                  <th className="px-6 py-5">Detalle</th>
                  <th className="px-6 py-5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseList && purchaseList.length > 0 ? (
                  purchaseList.map((p) => (
                    <tr key={p.id} className="hover:bg-accent transition-colors group">
                      <td className="px-6 py-5 text-xs text-muted-foreground uppercase tracking-tight">
                        {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : '-'}
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-primary uppercase tracking-tighter">{p.invoiceNumber || '-'}</td>
                      <td className="px-6 py-5 text-xs text-foreground uppercase tracking-tight">{p.supplierName || "Desconocido"}</td>
                      <td className="px-6 py-5 text-[10px] text-muted-foreground italic max-w-xs truncate">{p.notes || "-"}</td>
                      <td className="px-6 py-5 text-lg font-black text-foreground text-right">
                        ${p.totalAmount ? Math.floor(Number(p.totalAmount)).toLocaleString() : '0'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center text-slate-400 font-black uppercase tracking-widest text-xs italic">
                      No hay facturas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
