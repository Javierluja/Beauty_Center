import { useState, useMemo } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  ShoppingCart,
  Minus,
  Plus,
  Sparkles,
  AlertCircle,
  Scissors,
  Package,
  CreditCard,
  Banknote,
  Smartphone,
  Gift,
  ChevronRight,
  Hash,
  Trash2,
  Pencil,
  ShieldCheck,
  Save,
  Calendar,
  ReceiptText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PAYMENT_METHODS = [
  { id: "contado", label: "Contado / Efectivo", icon: Banknote },
  { id: "transferencia", label: "Transferencia", icon: Smartphone },
  { id: "transbank", label: "Transbank", icon: CreditCard },
  { id: "credito", label: "Crédito", icon: CreditCard },
  { id: "cortesia", label: "Cortesía", icon: Sparkles },
  { id: "merma", label: "Merma", icon: Trash2 },
  { id: "gift_card", label: "Gift Card", icon: Gift },
];

export default function Ventas() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string>("general");
  const [paymentMethod, setPaymentMethod] = useState<string>("contado");
  const [saleDate, setSaleDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [discount, setDiscount] = useState("0");
  const [viewingSaleId, setViewingSaleId] = useState<number | null>(null);

  const { data: services, isLoading: loadingServices } = trpc.service.list.useQuery({ active: true });
  const { data: products, isLoading: loadingProducts } = trpc.product.list.useQuery();
  const { data: clients } = trpc.customers.list.useQuery();
  const { data: salesHistory, isLoading: loadingSales } = trpc.sale.list.useQuery();
  const { data: saleItems, isLoading: loadingItems } = trpc.sale.getItems.useQuery(viewingSaleId || 0, { enabled: !!viewingSaleId });
  const { data: user } = trpc.auth.me.useQuery();

  // Control de permisos: Solo admin y admin_pro pueden modificar ventas registradas
  const canEditSales = user?.role === 'admin' || user?.role === 'admin_pro';

  // Acceso al Cierre de Caja: admin, admin_pro o permiso explícito 'cierre_caja'
  const canAccessCierre = useMemo(() => {
    if (user?.role === 'admin_pro' || user?.role === 'admin') return true;
    if (!user?.permissions) return false;
    try {
      const p = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
      return p?.cierre_caja === true;
    } catch {
      return false;
    }
  }, [user]);

  // Estado para la modificación de ventas
  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    paymentMethod: "contado",
    status: "paid",
    total: "0",
    discount: "0",
    finalTotal: "0",
    amountPaid: "0",
    notes: "",
    saleDate: new Date().toLocaleDateString('en-CA'),
  });
  const [editItems, setEditItems] = useState<any[]>([]);

  const groupedServices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filtered = (services || []).filter(s => {
      const name = (s.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cat = (s.category || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return name.includes(term) || cat.includes(term);
    });
    const groups: Record<string, any[]> = {};
    filtered.forEach(s => {
      const cat = s.category || "GENERAL";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [services, searchTerm]);

  const groupedProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filtered = (products || []).filter(p => {
      const name = (p.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cat = (p.category || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const sku = (p.sku || "").toLowerCase();
      return name.includes(term) || cat.includes(term) || sku.includes(term);
    });
    const groups: Record<string, any[]> = {};
    filtered.forEach(p => {
      const cat = p.category || "GENERAL";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [products, searchTerm]);

  const createSale = trpc.sale.create.useMutation({
    onSuccess: () => {
      utils.sale.list.invalidate();
      utils.product.list.invalidate();
      utils.customers.list.invalidate();
      utils.sale.dailySummary.invalidate();
      setCart([]);
      setDiscount("0");
      setSaleDate(new Date().toLocaleDateString('en-CA'));
      toast({ title: "¡Venta realizada! ✨" });
    },
    onError: (err) => {
      toast({ title: "Error en la venta", description: err.message, variant: "destructive" });
    }
  });

  const updateSaleMutation = trpc.sale.update.useMutation({
    onSuccess: () => {
      utils.sale.list.invalidate();
      utils.sale.summary.invalidate();
      utils.sale.dailySummary.invalidate();
      utils.sale.paymentMethodsDetail.invalidate();
      utils.customers.list.invalidate();
      toast({
        title: "¡Venta modificada con éxito! ✨",
        description: `Los datos de la venta #${editingSale?.id} han sido actualizados.`,
      });
      setEditingSale(null);
      if (viewingSaleId) {
        utils.sale.getItems.invalidate(viewingSaleId);
      }
    },
    onError: (err) => {
      toast({
        title: "Error al actualizar venta",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const [saleToDelete, setSaleToDelete] = useState<any | null>(null);

  const deleteSaleMutation = trpc.sale.delete.useMutation({
    onSuccess: () => {
      utils.sale.list.invalidate();
      utils.product.list.invalidate();
      utils.customers.list.invalidate();
      toast({
        title: "¡Venta eliminada con éxito! 🗑️",
        description: `La venta #${saleToDelete?.id} ha sido eliminada y el stock fue restaurado.`,
      });
      setSaleToDelete(null);
      setViewingSaleId(null);
      setEditingSale(null);
    },
    onError: (err) => {
      toast({
        title: "Error al eliminar venta",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  async function handleOpenEdit(sale: any) {
    if (!canEditSales) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden modificar registros de venta.",
        variant: "destructive",
      });
      return;
    }

    setEditingSale(sale);
    const subtotal = sale.total ? Math.round(Number(sale.total)).toString() : "0";
    const discountVal = sale.discount ? Math.round(Number(sale.discount)).toString() : "0";
    const finalVal = sale.finalTotal ? Math.round(Number(sale.finalTotal)).toString() : "0";
    const paidVal = sale.amountPaid 
      ? Math.round(Number(sale.amountPaid)).toString() 
      : (sale.status === 'paid' ? finalVal : "0");

    const dateVal = sale.createdAt 
      ? new Date(sale.createdAt).toLocaleDateString('en-CA') 
      : new Date().toLocaleDateString('en-CA');

    setEditForm({
      paymentMethod: sale.paymentMethod || "contado",
      status: sale.status || "paid",
      total: subtotal,
      discount: discountVal,
      finalTotal: finalVal,
      amountPaid: paidVal,
      notes: sale.notes || "",
      saleDate: dateVal,
    });

    try {
      const items = await utils.sale.getItems.fetch(sale.id);
      setEditItems(
        (items || []).map((it: any) => ({
          id: it.id,
          name: it.name,
          type: it.type,
          quantity: it.quantity,
          unitPrice: Math.round(Number(it.unitPrice)).toString(),
          totalPrice: Math.round(Number(it.totalPrice)).toString(),
        }))
      );
    } catch {
      setEditItems([]);
    }
  }

  function handleItemChange(itemId: number, field: 'quantity' | 'unitPrice', val: string) {
    setEditItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const qty = field === 'quantity' ? Math.max(1, parseInt(val) || 1) : item.quantity;
          const price = field === 'unitPrice' ? Math.max(0, parseInt(val) || 0) : Number(item.unitPrice);
          const total = qty * price;
          return {
            ...item,
            quantity: qty,
            unitPrice: price.toString(),
            totalPrice: total.toString(),
          };
        }
        return item;
      });

      const newSubtotal = updated.reduce((acc, it) => acc + Number(it.totalPrice), 0);
      const discountNum = Number(editForm.discount) || 0;
      const newFinal = Math.max(0, newSubtotal - discountNum);

      setEditForm(f => ({
        ...f,
        total: newSubtotal.toString(),
        finalTotal: newFinal.toString(),
        amountPaid: f.status === 'paid' ? newFinal.toString() : f.amountPaid,
      }));

      return updated;
    });
  }

  function handleTotalOrDiscountChange(newTotalStr: string, newDiscountStr: string) {
    const tot = Math.max(0, Number(newTotalStr) || 0);
    const disc = Math.max(0, Number(newDiscountStr) || 0);
    const fin = Math.max(0, tot - disc);

    setEditForm(prev => ({
      ...prev,
      total: newTotalStr,
      discount: newDiscountStr,
      finalTotal: fin.toString(),
      amountPaid: prev.status === 'paid' ? fin.toString() : prev.amountPaid,
    }));
  }

  function handleFinalTotalChange(val: string) {
    setEditForm(prev => ({
      ...prev,
      finalTotal: val,
      amountPaid: prev.status === 'paid' ? val : prev.amountPaid,
    }));
  }

  function handleSaveEdit() {
    if (!editingSale) return;
    updateSaleMutation.mutate({
      id: editingSale.id,
      paymentMethod: editForm.paymentMethod,
      status: editForm.status,
      total: editForm.total,
      discount: editForm.discount,
      finalTotal: editForm.finalTotal,
      amountPaid: editForm.amountPaid,
      notes: editForm.notes,
      saleDate: editForm.saleDate,
      items: editItems.map(it => ({
        id: it.id,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
      })),
    });
  }

  const cartTotal = cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  const finalTotal = Math.max(0, cartTotal - Number(discount));
  const neto = Math.round(finalTotal / 1.19);
  const iva = finalTotal - neto;

  function addToCart(item: any, type: 'servicio' | 'producto') {
    if (type === 'producto' && Number(item.stock) <= 0) {
      toast({
        title: "Sin Stock",
        description: `El producto "${item.name}" no tiene unidades disponibles en inventario.`,
        variant: "destructive"
      });
      return;
    }

    const existing = cart.find(i => i.id === item.id && i.type === type);
    if (existing) {
      if (type === 'producto' && existing.quantity >= Number(item.stock)) {
        toast({
          title: "Stock máximo alcanzado",
          description: `Solo hay ${item.stock} unidades de "${item.name}".`,
          variant: "destructive"
        });
        return;
      }
      setCart(cart.map(i => (i.id === item.id && i.type === type) ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, type, quantity: 1 }]);
    }
  }

  function updateQuantity(id: number, type: string, delta: number) {
    const existing = cart.find(i => i.id === id && i.type === type);
    if (existing && type === 'producto' && delta > 0) {
      const prod = products?.find(p => p.id === id);
      if (prod && existing.quantity >= Number(prod.stock)) {
        toast({
          title: "Stock máximo",
          description: `No hay más unidades disponibles de este producto.`,
          variant: "destructive"
        });
        return;
      }
    }

    setCart(cart.map(i => {
      if (i.id === id && i.type === type) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  }

  function removeFromCart(id: number, type: string) {
    setCart(cart.filter(i => !(i.id === id && i.type === type)));
  }

  function handleCheckout() {
    if (cart.length === 0) return;
    if (paymentMethod === 'credito' && clientId === "general") {
      toast({ title: "Acción no permitida", description: "Ventas a crédito requieren cliente registrado.", variant: "destructive" });
      return;
    }

    createSale.mutate({
      clientId: clientId === "general" ? undefined : Number(clientId),
      paymentMethod,
      discount: discount,
      total: cartTotal.toString(),
      finalTotal: finalTotal.toString(),
      status: paymentMethod === 'credito' ? 'pending' : 'paid',
      saleDate: saleDate,
      items: cart.map(i => ({
        type: i.type === 'servicio' ? 'service' : 'product',
        itemId: i.id,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.price.toString()
      }))
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Punto de Venta</h1>
        {canAccessCierre && (
          <Link to="/cierre-caja">
            <Button variant="outline" className="h-9 px-3 rounded-xl border-teal-600/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950 font-bold text-xs uppercase flex items-center gap-2 shadow-sm">
              <ReceiptText className="h-4 w-4 text-teal-600" />
              Cierre de Caja
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="caja" className="w-full h-full flex flex-col">
        <TabsList className="bg-muted p-1 h-10 rounded-xl w-full max-w-[300px] grid grid-cols-2 mb-4 border border-border">
          <TabsTrigger value="caja" className="rounded-lg font-semibold text-xs uppercase data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md">
            Caja
          </TabsTrigger>
          <TabsTrigger value="historial" className="rounded-lg font-semibold text-xs uppercase data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md">
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="caja" className="m-0 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-140px)] min-h-[600px]">
            {/* SELECCIÓN IZQUIERDA */}
            <div className="lg:col-span-7 flex flex-col gap-3 h-[520px] lg:h-full overflow-hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
          <Input 
            placeholder="Buscar por nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 rounded-2xl border-primary/10 bg-background shadow-sm font-bold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card p-3 rounded-2xl border border-border shadow-sm">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="rounded-xl border-primary/10 h-10 bg-background font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="general">Cliente General (Sin registro)</SelectItem>
                {(clients || []).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-foreground ml-1">Forma de Pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="rounded-xl border-primary/10 h-10 bg-background font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon;
                  return (
                  <SelectItem key={m.id} value={m.id} className="text-xs font-bold uppercase">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3 w-3" /> {m.label}
                    </div>
                  </SelectItem>
                )})}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1">
              <Label className="text-[10px] font-black uppercase text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" /> Fecha de Venta
              </Label>
              {saleDate !== new Date().toLocaleDateString('en-CA') && (
                <button
                  type="button"
                  onClick={() => setSaleDate(new Date().toLocaleDateString('en-CA'))}
                  className="text-[9px] font-bold text-primary hover:underline uppercase"
                >
                  Hoy
                </button>
              )}
            </div>
            <Input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className={`rounded-xl border-primary/10 h-10 bg-background font-bold text-xs ${
                saleDate !== new Date().toLocaleDateString('en-CA') ? 'border-primary ring-1 ring-primary/30 bg-primary/5 text-primary' : ''
              }`}
            />
          </div>
        </div>

        <Tabs defaultValue="servicios" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="bg-muted p-1 h-12 rounded-xl w-full grid grid-cols-2 mb-4 border border-border">
            <TabsTrigger value="servicios" className="rounded-lg font-semibold text-xs uppercase flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary">
              <Scissors className="h-3.5 w-3.5" /> Servicios
            </TabsTrigger>
            <TabsTrigger value="productos" className="rounded-lg font-semibold text-xs uppercase flex items-center gap-2 data-[state=active]:bg-card data-[state=active]:text-primary">
              <Package className="h-3.5 w-3.5" /> Productos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="servicios" className="flex-1 overflow-y-auto pr-2 no-scrollbar m-0">
            {Object.entries(groupedServices).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 ml-1 border-l-2 border-primary pl-3 py-0.5">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {items.map(s => (
                    <button
                      key={s.id}
                      onClick={() => addToCart(s, 'servicio')}
                      className="p-3.5 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-accent transition-all text-left flex items-center justify-between group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-xs uppercase truncate">{s.name}</p>
                        <p className="text-sm font-bold text-primary mt-0.5">${Math.floor(Number(s.price)).toLocaleString()}</p>
                      </div>
                      <Plus className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="productos" className="flex-1 overflow-y-auto pr-2 no-scrollbar m-0">
            {Object.entries(groupedProducts).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4 ml-2 border-l-4 border-primary pl-3 bg-slate-100 py-1 rounded-r-lg">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {items.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p, 'producto')}
                      className="p-4 bg-admin-panel border-2 border-slate-100 rounded-2xl hover:border-primary/40 hover:shadow-xl transition-all text-left flex items-center justify-between group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground text-xs uppercase truncate">{p.name}</p>
                          <Badge variant="outline" className={`text-[8px] h-4 px-1 border-none ${p.stock < 5 ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>S:{p.stock}</Badge>
                        </div>
                        <p className="text-sm font-bold text-primary mt-0.5">${Math.floor(Number(p.price)).toLocaleString()}</p>
                      </div>
                      <Plus className="h-4 w-4 text-primary/20 group-hover:text-primary transition-colors shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* CARRITO Y CIERRE DERECHA */}
      <div className="lg:col-span-5 border border-border shadow-xl rounded-2xl overflow-hidden flex flex-col bg-card h-[520px] lg:h-full min-h-[480px]">
        {/* ENCABEZADO ORDEN */}
        <div className="border-b border-border p-4 bg-muted/20 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground text-sm uppercase">Orden de Venta</span>
          </div>
          {cart.length > 0 && (
            <Badge variant="secondary" className="font-bold text-[10px] uppercase">
              {cart.reduce((a, b) => a + b.quantity, 0)} {cart.reduce((a, b) => a + b.quantity, 0) === 1 ? 'ítem' : 'ítems'}
            </Badge>
          )}
        </div>
        
        {/* LISTADO DE ITEMS CON SCROLL SEGURO Y MIN-HEIGHT */}
        <div className="flex-1 min-h-[140px] overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-muted-foreground/60 py-8">
              <ShoppingCart className="h-14 w-14 mb-2.5 opacity-40 text-primary" />
              <p className="font-bold uppercase text-xs tracking-wider text-center">Selecciona ítems para comenzar</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cart.map((item) => (
                <div 
                  key={`${item.type}-${item.id}`} 
                  className="flex items-center justify-between bg-muted/40 hover:bg-muted/70 p-3 rounded-xl border border-border/80 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge 
                        variant="outline" 
                        className={`text-[8px] font-black uppercase px-1.5 py-0 border-none ${
                          item.type === 'servicio' 
                            ? 'bg-primary/15 text-primary' 
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {item.type === 'servicio' ? 'Servicio' : 'Producto'}
                      </Badge>
                      <p className="font-bold text-foreground text-xs uppercase truncate leading-tight">
                        {item.name}
                      </p>
                    </div>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      ${Math.floor(Number(item.price)).toLocaleString()} c/u · <span className="text-primary font-bold">${Math.floor(Number(item.price) * item.quantity).toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-background border border-border rounded-lg shadow-sm">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => updateQuantity(item.id, item.type, -1)} 
                        className="h-7 w-7 text-primary hover:bg-muted rounded-l-lg"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-black text-xs w-6 text-center text-foreground">
                        {item.quantity}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => updateQuantity(item.id, item.type, 1)} 
                        className="h-7 w-7 text-primary hover:bg-muted rounded-r-lg"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeFromCart(item.id, item.type)} 
                      className="text-destructive hover:bg-destructive/10 h-7 w-7 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CIERRE DE VENTA COMPACTO Y SHRINK-0 */}
        <div className="p-4 bg-muted/40 border-t border-border space-y-3 shrink-0">
          <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
            <Label className="text-[11px] font-black uppercase text-foreground">Descuento ($)</Label>
            <Input 
              type="number" 
              min="0" 
              value={discount} 
              onChange={(e) => setDiscount(e.target.value)} 
              className="w-32 h-8 text-right font-black rounded-lg border-primary/20 text-sm bg-background"
            />
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex justify-between items-center text-muted-foreground text-xs">
              <span>Subtotal</span>
              <span className="text-foreground font-semibold">${cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground text-xs">
              <span>Neto</span>
              <span className="text-foreground font-semibold">${neto.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground text-xs">
              <span>IVA (19%)</span>
              <span className="text-foreground font-semibold">${iva.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-primary text-2xl font-black uppercase tracking-tight pt-2 border-t border-border">
              <span>Total a Pagar</span>
              <span>${finalTotal.toLocaleString()}</span>
            </div>
          </div>

          {saleDate !== new Date().toLocaleDateString('en-CA') && (
            <div className="bg-primary/10 border border-primary/30 p-2 rounded-xl text-center">
              <p className="text-[10px] font-black uppercase text-primary flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" /> Venta Retroactiva: {new Date(`${saleDate}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          <Button 
            onClick={handleCheckout} 
            disabled={cart.length === 0 || createSale.isPending || (paymentMethod === 'credito' && clientId === "general")} 
            className="w-full h-14 rounded-2xl bg-primary text-base font-black shadow-xl shadow-primary/20 group active:scale-95 transition-all text-primary-foreground"
          >
            {createSale.isPending ? "PROCESANDO..." : (
              <span className="flex items-center justify-center gap-2 uppercase tracking-wider">
                COBRAR AHORA <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </div>
      </div>
      </div>
      </TabsContent>

      <TabsContent value="historial" className="m-0">
        <Card className="border-primary/10 shadow-xl rounded-3xl overflow-hidden bg-admin-panel backdrop-blur-sm">
          <CardHeader className="bg-primary/5 border-b border-primary/5 p-6 flex flex-row items-center justify-between">
            <CardTitle className="font-black text-primary uppercase flex items-center gap-2">
              <Banknote className="h-5 w-5" /> Registro Histórico
            </CardTitle>
            <Button 
              variant="outline" 
              onClick={() => {
                if (!salesHistory) return;
                const csvData = [
                  ["ID", "Cliente", "Fecha", "Metodo Pago", "Estado", "Total"],
                  ...salesHistory.map(s => [
                    s.id,
                    s.clientName || "Cliente General",
                    new Date(s.createdAt).toLocaleString('es-ES'),
                    s.paymentMethod,
                    s.status === 'paid' ? 'Pagado' : 'Pendiente',
                    s.finalTotal
                  ])
                ].map(e => e.join(",")).join("\n");
                
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `Ventas_BeautyCenter_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="font-black text-xs uppercase bg-white border-primary/20 hover:bg-primary/5"
            >
              ⬇️ Descargar Excel (CSV)
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loadingSales ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
              </div>
            ) : !salesHistory || salesHistory.length === 0 ? (
              <div className="p-20 text-center text-muted-foreground font-black uppercase tracking-widest text-sm italic">
                Aún no hay ventas registradas
              </div>
            ) : (
              <div className="divide-y divide-primary/5 max-h-[calc(100vh-250px)] overflow-y-auto no-scrollbar">
                {salesHistory.map((sale) => (
                  <div 
                    key={sale.id} 
                    onClick={() => setViewingSaleId(sale.id)}
                    className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <ShoppingCart className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm uppercase tracking-tight">{sale.clientName || "Cliente General"}</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 mt-0.5">
                          {new Date(sale.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-8 justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Método</p>
                        <Badge variant="outline" className="border-primary/20 text-primary uppercase font-black text-[9px]">
                          {sale.paymentMethod}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Estado</p>
                        <Badge className={`uppercase font-black text-[9px] border-none ${
                          sale.status === 'paid' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' 
                            : sale.status === 'cancelled'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400'
                        }`}>
                          {sale.status === 'paid' ? 'Pagado' : sale.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Total</p>
                        <p className="font-black text-primary text-xl tracking-tighter">${Number(sale.finalTotal).toLocaleString()}</p>
                      </div>
                      {canEditSales && (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(sale)}
                            className="h-8 px-2.5 rounded-lg border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs uppercase flex items-center gap-1 shadow-sm shrink-0"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Modificar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSaleToDelete(sale)}
                            className="h-8 w-8 p-0 rounded-lg border-red-200 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-900/40 dark:text-red-400 font-bold text-xs flex items-center justify-center shadow-sm shrink-0"
                            title="Eliminar venta"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

      <Dialog open={!!viewingSaleId} onOpenChange={(open) => !open && setViewingSaleId(null)}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-black text-primary uppercase flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Detalle de Venta #{viewingSaleId}
            </DialogTitle>
          </DialogHeader>
          
          {salesHistory?.find(s => s.id === viewingSaleId) && (() => {
            const viewingSale = salesHistory.find(s => s.id === viewingSaleId)!;
            return (
              <div className="space-y-4 pt-2">
                <div className="bg-muted/50 p-4 rounded-xl space-y-2 border border-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-semibold uppercase">Cliente:</span>
                    <span className="text-foreground font-black uppercase">{viewingSale.clientName || "Cliente General"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-semibold uppercase">Fecha:</span>
                    <span className="text-foreground font-medium">{new Date(viewingSale.createdAt).toLocaleString('es-ES')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-semibold uppercase">Método de Pago:</span>
                    <span className="text-foreground font-black uppercase">{viewingSale.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-semibold uppercase">Estado:</span>
                    <Badge className={`uppercase font-black text-[9px] border-none ${
                      viewingSale.status === 'paid' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' 
                        : viewingSale.status === 'cancelled'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400'
                    }`}>
                      {viewingSale.status === 'paid' ? 'Pagado' : viewingSale.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                    </Badge>
                  </div>
                  {viewingSale.notes && (
                    <div className="pt-2 border-t border-border mt-1">
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Notas:</p>
                      <p className="text-xs text-foreground italic mt-0.5">{viewingSale.notes}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">Ítems Vendidos</p>
                  {loadingItems ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full rounded-lg" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                  ) : !saleItems || saleItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic ml-1">No hay detalles disponibles.</p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                      {saleItems.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center bg-muted/30 p-2.5 rounded-lg border border-border text-xs">
                          <div>
                            <p className="font-black text-foreground uppercase">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{item.type === 'product' ? 'Producto' : 'Servicio'} · {item.quantity} x ${Number(item.unitPrice).toLocaleString()}</p>
                          </div>
                          <span className="font-black text-primary">${Number(item.totalPrice).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border flex justify-between items-center text-primary text-xl font-black uppercase tracking-tighter">
                  <span>Total Final</span>
                  <span>${Number(viewingSale.finalTotal).toLocaleString()}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full pt-1">
                  {canEditSales && (
                    <>
                      <Button 
                        onClick={() => {
                          const s = salesHistory?.find(sale => sale.id === viewingSaleId);
                          setViewingSaleId(null);
                          if (s) handleOpenEdit(s);
                        }} 
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl shadow-lg uppercase text-xs flex items-center justify-center gap-1.5"
                      >
                        <Pencil className="h-4 w-4" /> Modificar
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => {
                          const s = salesHistory?.find(sale => sale.id === viewingSaleId);
                          if (s) setSaleToDelete(s);
                        }} 
                        className="font-bold h-11 px-3.5 rounded-xl shadow-lg uppercase text-xs flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setViewingSaleId(null)} 
                    className={`${canEditSales ? 'w-auto' : 'w-full'} font-bold h-11 px-4 rounded-xl uppercase text-xs`}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DIALOG PARA MODIFICAR REGISTRO DE VENTA (SOLO ADMIN Y ADMIN PRO) */}
      <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
        <DialogContent className="max-w-lg w-[95vw] rounded-2xl border-border bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-black text-primary uppercase flex items-center gap-2 text-base">
                <Pencil className="h-4 w-4" /> Modificar Venta #{editingSale?.id}
              </DialogTitle>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Solo Administrador
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cliente: <span className="font-bold text-foreground uppercase">{editingSale?.clientName || "Cliente General"}</span> · {editingSale && new Date(editingSale.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </DialogHeader>

          {editingSale && (
            <div className="space-y-4 pt-3">
              {/* ESTADO, MÉTODO DE PAGO Y FECHA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-foreground">Estado de la Venta</Label>
                  <Select 
                    value={editForm.status} 
                    onValueChange={(val) => {
                      setEditForm(prev => ({
                        ...prev,
                        status: val,
                        amountPaid: val === 'paid' ? prev.finalTotal : (val === 'pending' && prev.amountPaid === prev.finalTotal ? "0" : prev.amountPaid)
                      }));
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="paid" className="text-xs font-bold text-green-600">
                        🟢 Pagado
                      </SelectItem>
                      <SelectItem value="pending" className="text-xs font-bold text-yellow-600">
                        🟡 Pendiente (Crédito)
                      </SelectItem>
                      <SelectItem value="cancelled" className="text-xs font-bold text-red-600">
                        🔴 Cancelado / Anulado
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-foreground">Forma de Pago</Label>
                  <Select 
                    value={editForm.paymentMethod} 
                    onValueChange={(val) => setEditForm(prev => ({ ...prev, paymentMethod: val }))}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs font-bold uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-xs font-bold uppercase">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary" /> Fecha de Venta
                  </Label>
                  <Input
                    type="date"
                    value={editForm.saleDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, saleDate: e.target.value }))}
                    className="h-9 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* ÍTEMS DE LA VENTA EDITABLES */}
              {editItems.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-foreground">Ítems de la Venta (Precios y Cantidades)</Label>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                    {editItems.map((item) => (
                      <div key={item.id} className="p-2.5 bg-muted/40 rounded-xl border border-border flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground uppercase truncate text-[11px]">{item.name}</p>
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-none bg-primary/10 text-primary uppercase font-bold">
                            {item.type === 'product' ? 'Producto' : 'Servicio'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-14">
                            <span className="text-[8px] text-muted-foreground uppercase block font-semibold">Cant.</span>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                              className="h-7 text-xs font-bold px-1.5"
                            />
                          </div>
                          <div className="w-20">
                            <span className="text-[8px] text-muted-foreground uppercase block font-semibold">P. Unit ($)</span>
                            <Input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                              className="h-7 text-xs font-bold px-1.5 text-right"
                            />
                          </div>
                          <div className="w-18 text-right">
                            <span className="text-[8px] text-muted-foreground uppercase block font-semibold">Subtotal</span>
                            <span className="font-black text-primary text-xs leading-7 block">
                              ${Number(item.totalPrice).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TOTALES Y PRECIOS */}
              <div className="p-3 bg-muted/30 rounded-xl border border-border space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-foreground">Subtotal ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editForm.total}
                      onChange={(e) => handleTotalOrDiscountChange(e.target.value, editForm.discount)}
                      className="h-8 text-xs font-bold text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-foreground">Descuento ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editForm.discount}
                      onChange={(e) => handleTotalOrDiscountChange(editForm.total, e.target.value)}
                      className="h-8 text-xs font-bold text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase text-primary">Total Final ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editForm.finalTotal}
                      onChange={(e) => handleFinalTotalChange(e.target.value)}
                      className="h-8 text-xs font-black text-right text-primary bg-primary/5 border-primary/30"
                    />
                  </div>
                </div>

                {/* MONTO PAGADO Y SALDO PENDIENTE */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <Label className="text-[10px] font-black uppercase text-foreground">Monto Pagado ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editForm.amountPaid}
                      onChange={(e) => setEditForm(prev => ({ ...prev, amountPaid: e.target.value }))}
                      className="h-8 text-xs font-bold text-right mt-1"
                    />
                  </div>

                  <div className="text-right pt-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Saldo Pendiente:</span>
                    <span className={`text-sm font-black ${Math.max(0, Number(editForm.finalTotal) - Number(editForm.amountPaid || 0)) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      ${Math.max(0, Number(editForm.finalTotal) - Number(editForm.amountPaid || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* NOTAS */}
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-foreground">Notas u Observaciones</Label>
                <Textarea
                  placeholder="Motivo de la corrección o notas de la venta..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="h-16 text-xs rounded-xl resize-none"
                />
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => {
                    const s = editingSale;
                    setEditingSale(null);
                    setSaleToDelete(s);
                  }}
                  className="font-bold h-10 px-3 rounded-xl uppercase text-xs flex items-center justify-center gap-1.5"
                  title="Eliminar esta venta definitivamente"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingSale(null)}
                  className="flex-1 font-bold h-10 rounded-xl uppercase text-xs"
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSaveEdit}
                  disabled={updateSaleMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 rounded-xl shadow-lg uppercase text-xs flex items-center justify-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {updateSaleMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMACIÓN PARA ELIMINAR VENTA */}
      <AlertDialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> ¿Eliminar esta venta definitivamente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-2">
              Esta acción no se puede deshacer. Se eliminará la venta{" "}
              <span className="font-bold text-foreground">#{saleToDelete?.id}</span> por un total de{" "}
              <span className="font-bold text-foreground">
                ${Number(saleToDelete?.finalTotal || 0).toLocaleString()}
              </span>{" "}
              asociada a{" "}
              <span className="font-bold text-foreground">
                {saleToDelete?.clientName || "Cliente General"}
              </span>.
              <br /><br />
              <span className="font-semibold text-foreground">Restauración de inventario:</span> Los
              productos físicos incluidos en la venta se sumarán de nuevo al stock automáticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              className="font-bold rounded-xl text-xs uppercase"
              disabled={deleteSaleMutation.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (saleToDelete) {
                  deleteSaleMutation.mutate({ id: saleToDelete.id });
                }
              }}
              disabled={deleteSaleMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl text-xs uppercase"
            >
              {deleteSaleMutation.isPending ? "Eliminando..." : "Sí, Eliminar Venta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
