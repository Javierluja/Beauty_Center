import { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PAYMENT_METHODS = [
  { id: "contado", label: "Contado", icon: Banknote },
  { id: "transferencia", label: "Transferencia", icon: Smartphone },
  { id: "credito", label: "Crédito", icon: CreditCard },
  { id: "transbank", label: "Transbank", icon: CreditCard },
  { id: "gift_card", label: "Gift Card", icon: Gift },
];

export default function Ventas() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string>("general");
  const [paymentMethod, setPaymentMethod] = useState<string>("contado");
  const [discount, setDiscount] = useState("0");
  const [viewingSaleId, setViewingSaleId] = useState<number | null>(null);

  const { data: services, isLoading: loadingServices } = trpc.service.list.useQuery({ active: true });
  const { data: products, isLoading: loadingProducts } = trpc.product.list.useQuery();
  const { data: clients } = trpc.customers.list.useQuery();
  const { data: salesHistory, isLoading: loadingSales } = trpc.sale.list.useQuery();
  const { data: saleItems, isLoading: loadingItems } = trpc.sale.getItems.useQuery(viewingSaleId || 0, { enabled: !!viewingSaleId });

  const groupedServices = useMemo(() => {
    const filtered = (services || []).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const groups: Record<string, any[]> = {};
    filtered.forEach(s => {
      const cat = s.category || "GENERAL";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [services, searchTerm]);

  const groupedProducts = useMemo(() => {
    const filtered = (products || []).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
      setCart([]);
      setDiscount("0");
      toast({ title: "¡Venta realizada! ✨" });
    },
    onError: (err) => {
      toast({ title: "Error en la venta", description: err.message, variant: "destructive" });
    }
  });

  const cartTotal = cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
  const finalTotal = Math.max(0, cartTotal - Number(discount));
  const neto = Math.round(finalTotal / 1.19);
  const iva = finalTotal - neto;

  function addToCart(item: any, type: 'servicio' | 'producto') {
    const existing = cart.find(i => i.id === item.id && i.type === type);
    if (existing) {
      setCart(cart.map(i => (i.id === item.id && i.type === type) ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, type, quantity: 1 }]);
    }
  }

  function updateQuantity(id: number, type: string, delta: number) {
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
          <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-130px)] min-h-[500px]">
            {/* SELECCIÓN IZQUIERDA */}
            <div className="lg:col-span-7 flex flex-col gap-3 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
          <Input 
            placeholder="Buscar por nombre..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 rounded-2xl border-primary/10 bg-background shadow-sm font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="space-y-1">
            <Label className="text-[10px] font-medium uppercase text-muted-foreground ml-1">Cliente</Label>
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
            <Label className="text-[11px] font-black uppercase text-slate-800 ml-1">Forma de Pago</Label>
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
      <Card className="lg:col-span-5 border border-border shadow-xl rounded-2xl overflow-hidden flex flex-col bg-card">
        <CardHeader className="border-b border-border p-4">
          <CardTitle className="font-bold text-foreground flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4 text-primary" /> Orden de Venta
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-primary/40 py-20">
              <ShoppingCart className="h-20 w-20 mb-4 opacity-50" />
              <p className="font-black uppercase text-xs tracking-widest text-center opacity-80">Selecciona ítems para comenzar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SERVICIOS EN CARRITO */}
              {cart.some(i => i.type === 'servicio') && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest ml-1">Servicios</p>
                  {cart.filter(i => i.type === 'servicio').map(item => (
                    <div key={`${item.type}-${item.id}`} className="flex items-center justify-between group bg-muted/50 p-3 rounded-xl border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-primary text-xs uppercase truncate leading-none">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">${Math.floor(Number(item.price)).toLocaleString()} c/u</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-muted rounded-lg px-1">
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.type, -1)} className="h-7 w-7 text-primary hover:bg-accent rounded-md"><Minus className="h-3 w-3" /></Button>
                          <span className="font-bold text-xs w-7 text-center text-foreground">{item.quantity}</span>
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.type, 1)} className="h-7 w-7 text-primary hover:bg-accent rounded-md"><Plus className="h-3 w-3" /></Button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id, item.type)} className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-xl"><Minus className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PRODUCTOS EN CARRITO */}
              {cart.some(i => i.type === 'producto') && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest ml-1">Productos</p>
                  {cart.filter(i => i.type === 'producto').map(item => (
                    <div key={`${item.type}-${item.id}`} className="flex items-center justify-between group bg-muted/30 p-3 rounded-xl border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-primary text-xs uppercase truncate leading-none">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">${Math.floor(Number(item.price)).toLocaleString()} c/u</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-primary/5 rounded-xl px-1">
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.type, -1)} className="h-8 w-8 text-primary"><Minus className="h-3 w-3" /></Button>
                          <span className="font-black text-xs w-6 text-center text-primary">{item.quantity}</span>
                          <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.type, 1)} className="h-8 w-8 text-primary"><Plus className="h-3 w-3" /></Button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id, item.type)} className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-xl"><Minus className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* CIERRE DE VENTA */}
        <div className="p-5 bg-muted/50 border-t border-border space-y-4">

          <div className="flex items-center justify-between border-b border-border pb-3">
            <Label className="text-[11px] font-black uppercase text-slate-800">Descuento ($)</Label>
            <Input 
              type="number" 
              min="0" 
              value={discount} 
              onChange={(e) => setDiscount(e.target.value)}
              className="w-32 h-9 text-right font-black rounded-lg border-primary/20 text-sm"
            />
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-muted-foreground text-xs">
              <span>Subtotal</span>
              <span className="text-foreground font-medium">${cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground text-xs">
              <span>Neto</span>
              <span className="text-foreground font-medium">${neto.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground text-xs">
              <span>IVA (19%)</span>
              <span className="text-foreground font-medium">${iva.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-primary text-3xl font-black uppercase tracking-tighter pt-2 border-t border-primary/5">
              <span>Total</span>
              <span>${finalTotal.toLocaleString()}</span>
            </div>
          </div>

          <Button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || createSale.isPending || (paymentMethod === 'credito' && clientId === "general")}
            className="w-full h-16 rounded-3xl bg-primary text-lg font-black shadow-xl shadow-primary/20 group active:scale-95 transition-all"
          >
            {createSale.isPending ? "PROCESANDO..." : (
              <span className="flex items-center justify-center gap-3 uppercase tracking-widest">
                COBRAR AHORA <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
            </Button>
          </div>
        </Card>
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
                        <Badge className={`uppercase font-black text-[9px] border-none ${sale.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {sale.status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Total</p>
                        <p className="font-black text-primary text-xl tracking-tighter">${Number(sale.finalTotal).toLocaleString()}</p>
                      </div>
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
                    <Badge className={`uppercase font-black text-[9px] border-none ${viewingSale.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {viewingSale.status === 'paid' ? 'Pagado' : 'Pendiente'}
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
                
                <Button onClick={() => setViewingSaleId(null)} className="w-full bg-primary hover:bg-primary/90 font-bold h-11 rounded-xl shadow-lg uppercase text-xs">
                  Cerrar Detalle
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
