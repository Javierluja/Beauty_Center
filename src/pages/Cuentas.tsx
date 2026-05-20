import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Importación añadida
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Wallet,
  CheckCircle2,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  Gift,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Cuentas() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [abonos, setAbonos] = useState<Record<number, string>>({});

  const { data: unpaidSales, isLoading } = trpc.sale.list.useQuery({ 
    status: 'pending' 
  });
  
  const { data: clients, isLoading: loadingClients } = trpc.customers.list.useQuery();
  const [giftBalances, setGiftBalances] = useState<Record<number, string>>({});

  const addGiftBalance = trpc.customers.addBalance.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      toast({ title: "Saldo agregado 🎁", description: "El cliente ahora tiene saldo a favor." });
    }
  });

  const markAsPaid = trpc.sale.updateStatus.useMutation({
    onSuccess: () => {
      utils.sale.list.invalidate();
      toast({ title: "¡Pago completado! 💵", description: "La cuenta ha sido saldada con éxito." });
    }
  });

  const registerAbono = trpc.sale.updateAbono.useMutation({
    onSuccess: (data) => {
      utils.sale.list.invalidate();
      if (data?.status === 'paid') {
        toast({ title: "¡Deuda saldada! 💵", description: "El abono cubrió el total de la deuda." });
      } else {
        toast({ title: "Abono registrado ✍️", description: "El pago parcial se guardó correctamente." });
      }
    }
  });

  const filteredSales = unpaidSales?.filter(sale => 
    sale.clientName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDebt = filteredSales?.reduce((acc, sale) => {
    const debt = Number(sale.finalTotal) - Number(sale.amountPaid || 0);
    return acc + Math.max(0, debt);
  }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight uppercase">Control de Créditos 💰</h1>
          <p className="text-xs md:text-sm text-slate-600 font-black italic mt-1 uppercase tracking-widest">Cuentas pendientes por cobrar</p>
        </div>
        <Card className="bg-primary text-white border-none rounded-3xl px-8 py-4 shadow-xl shadow-primary/20">
          <p className="text-[10px] font-black uppercase opacity-80 mb-1">Deuda Total Pendiente</p>
          <p className="text-3xl font-black">${totalDebt.toLocaleString()}</p>
        </Card>
      </div>

      <Tabs defaultValue="deudas" className="w-full">
        <TabsList className="bg-muted p-1.5 h-14 rounded-2xl w-full max-w-[500px] grid grid-cols-2 mb-8 border border-border mx-auto md:mx-0">
          <TabsTrigger value="deudas" className="rounded-xl font-black text-xs uppercase data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
            Cuentas por Cobrar
          </TabsTrigger>
          <TabsTrigger value="giftcards" className="rounded-xl font-black text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
            Giftcards / Saldos a favor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deudas" className="space-y-6 m-0">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input 
              placeholder="Buscar deudor..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-12 h-14 rounded-2xl border-2 border-primary/20 bg-admin-panel shadow-lg font-black text-slate-800 placeholder:text-slate-400" 
            />
          </div>

          <div className="grid gap-4">
        {isLoading ? [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-3xl" />) : 
          filteredSales?.length === 0 ? (
            <div className="py-24 text-center bg-slate-100 rounded-[3rem] border-2 border-dashed border-slate-200">
              <CheckCircle2 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">¡No hay deudas pendientes! ✨</p>
            </div>
          ) : (
            filteredSales?.map(sale => (
              <Card key={sale.id} className="border-2 border-primary/10 rounded-[2.5rem] shadow-xl hover:border-primary transition-all bg-admin-panel group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="p-6 flex-1 flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
                        <User className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-lg uppercase leading-none mb-2 tracking-tight">{sale.clientName}</h3>
                        <div className="flex flex-wrap gap-3">
                          <Badge variant="outline" className="text-[10px] font-black h-6 px-3 border-slate-200 text-slate-600 flex items-center gap-2 uppercase bg-slate-100">
                            <Calendar className="h-3 w-3 text-primary" /> {new Date(sale.createdAt).toLocaleDateString()}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-black h-6 px-3 border-slate-200 text-slate-600 flex items-center gap-2 uppercase bg-slate-100">
                            <Wallet className="h-3 w-3 text-primary" /> Venta #{sale.id}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 md:bg-transparent p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-t-2 md:border-t-0 border-slate-50 w-full md:w-auto">
                      <div className="text-center md:text-right w-full md:w-auto flex flex-col gap-1">
                        <p className="text-[11px] font-black text-red-400 uppercase tracking-[0.2em]">Adeuda</p>
                        <p className="text-4xl font-black text-red-600 tracking-tighter">${Math.max(0, Number(sale.finalTotal) - Number(sale.amountPaid || 0)).toLocaleString()}</p>
                        {Number(sale.amountPaid) > 0 && (
                          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                            Abonado: ${Number(sale.amountPaid).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            placeholder="Monto" 
                            className="w-28 h-12 rounded-xl border-2 border-slate-200 font-black text-lg focus:border-primary transition-all"
                            value={abonos[sale.id] || ""}
                            onChange={(e) => setAbonos({ ...abonos, [sale.id]: e.target.value })}
                          />
                          <Button 
                            onClick={() => {
                              if (!abonos[sale.id]) return;
                              registerAbono.mutate({ id: sale.id, amount: abonos[sale.id] });
                              setAbonos({ ...abonos, [sale.id]: "" });
                            }}
                            disabled={registerAbono.isPending || !abonos[sale.id]}
                            className="bg-primary hover:bg-primary/90 text-white font-black rounded-xl h-12 px-6 shadow-xl uppercase text-xs tracking-widest"
                          >
                            Abonar
                          </Button>
                        </div>
                        <Button 
                          onClick={() => markAsPaid.mutate({ id: sale.id, status: 'paid' })}
                          className="bg-green-600 hover:bg-green-700 text-white font-black rounded-xl h-12 px-6 shadow-xl shadow-green-200 uppercase tracking-widest w-full mt-2"
                        >
                          Saldar Total
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        }
          </div>
        </TabsContent>

        <TabsContent value="giftcards" className="space-y-6 m-0">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            <Input 
              placeholder="Buscar cliente para agregar saldo..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-12 h-14 rounded-2xl border-2 border-primary/20 bg-admin-panel shadow-lg font-black text-slate-800 placeholder:text-slate-400" 
            />
          </div>
          
          <div className="grid gap-4">
            {loadingClients ? [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-3xl" />) : 
              clients?.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(client => (
                <Card key={client.id} className="border-2 border-primary/10 rounded-[2.5rem] shadow-xl hover:border-primary transition-all bg-admin-panel group overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center">
                      <div className="p-6 flex-1 flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                           <Gift className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-lg uppercase leading-none mb-2 tracking-tight">{client.name}</h3>
                          <Badge variant="outline" className="text-[10px] font-black h-6 px-3 border-slate-200 text-slate-600 flex items-center gap-2 uppercase bg-slate-100">
                            Saldo Actual: ${Number(client.balance || 0).toLocaleString()}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-primary/5 md:bg-transparent p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-t-2 md:border-t-0 border-primary/10 w-full md:w-auto">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <Input 
                            type="number" 
                            placeholder="Monto Giftcard" 
                            className="w-40 h-12 rounded-xl border-2 border-primary/20 font-black text-lg focus:border-primary transition-all bg-white"
                            value={giftBalances[client.id] || ""}
                            onChange={(e) => setGiftBalances({ ...giftBalances, [client.id]: e.target.value })}
                          />
                          <Button 
                            onClick={() => {
                              if (!giftBalances[client.id]) return;
                              addGiftBalance.mutate({ id: client.id, amountToAdd: Number(giftBalances[client.id]) });
                              setGiftBalances({ ...giftBalances, [client.id]: "" });
                            }}
                            disabled={addGiftBalance.isPending || !giftBalances[client.id]}
                            className="bg-primary hover:bg-primary/90 text-white font-black rounded-xl h-12 px-6 shadow-xl uppercase text-xs tracking-widest"
                          >
                            Añadir Saldo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
