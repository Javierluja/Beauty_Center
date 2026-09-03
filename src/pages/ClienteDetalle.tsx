import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  User,
  Phone,
  Mail,
  Plus,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const clientIdNum = parseInt(id!);
  const utils = trpc.useUtils();
  const [selectedService, setSelectedService] = useState("");
  const [sessionCount, setSessionCount] = useState(10);
  const [customTitle, setCustomTitle] = useState("");

  const { data: client, isLoading: clientLoading } = trpc.customers.byId.useQuery(clientIdNum);
  const { data: packs, isLoading: packsLoading } = trpc.session.listByClient.useQuery(clientIdNum);
  const { data: services } = trpc.service.list.useQuery({ active: true });
  const { data: appointments } = trpc.appointment.list.useQuery({ clientId: clientIdNum });
  const { data: clientSales } = trpc.sale.list.useQuery({ clientId: clientIdNum });

  const createPack = trpc.session.createPack.useMutation({
    onSuccess: () => {
      utils.session.listByClient.invalidate();
      toast({ title: "Pack de sesiones creado" });
      setCustomTitle("");
      setSelectedService("");
    },
  });

  const useSession = trpc.session.useSession.useMutation({
    onSuccess: (data) => {
      utils.session.listByClient.invalidate();
      toast({ 
        title: "¡Sesión registrada! 🌸", 
        description: `Le quedan ${data.remaining} sesiones al cliente.` 
      });
    },
  });

  const handleCreatePack = () => {
    if (!selectedService) return;
    createPack.mutate({
      clientId: clientIdNum,
      serviceId: parseInt(selectedService),
      customTitle: customTitle || undefined,
      totalSessions: sessionCount,
    });
  };

  if (clientLoading) return <div className="p-8"><Skeleton className="h-40 w-full" /></div>;
  if (!client) return <div className="p-8 text-center">Cliente no encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/clientes")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Detalle del Cliente</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-admin-panel border-2 border-primary/10 rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{client.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{client.email || "No registrado"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-admin-panel border-2 border-primary/10 rounded-3xl shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Packs de Sesiones
              </CardTitle>
              <div className="flex gap-2">
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Elegir servicio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  type="number" 
                  min={1} 
                  max={30} 
                  value={sessionCount} 
                  onChange={(e) => setSessionCount(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <Button onClick={handleCreatePack} disabled={!selectedService}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {packsLoading ? <Skeleton className="h-20 w-full" /> : packs && packs.length > 0 ? (
                  packs.map(pack => (
                    <div key={pack.id} className="p-4 border-2 border-slate-100 rounded-2xl bg-slate-100/30 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">
                            {pack.customTitle || services?.find(s => s.id === pack.serviceId)?.name || "Servicio"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Comprado el {new Date(pack.purchaseDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={pack.remainingSessions > 0 ? 'default' : 'secondary'}>
                          {pack.remainingSessions > 0 ? 'Activo' : 'Finalizado'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progreso: {pack.totalSessions - pack.remainingSessions} / {pack.totalSessions}</span>
                          <span className="font-bold text-primary">
                            {Math.round(((pack.totalSessions - pack.remainingSessions) / pack.totalSessions) * 100)}%
                          </span>
                        </div>
                        <div className="flex gap-1 h-3">
                          {Array.from({ length: pack.totalSessions }).map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-full ${
                                i < (pack.totalSessions - pack.remainingSessions)
                                  ? "bg-primary shadow-[0_0_8px_rgba(212,165,165,0.6)]"
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {pack.remainingSessions > 0 && (
                        <Button 
                          className="w-full" 
                          onClick={() => useSession.mutate({ packId: pack.id })}
                          disabled={useSession.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Registrar Sesión #{pack.totalSessions - pack.remainingSessions + 1}
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Este cliente no tiene packs de sesiones activos.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="history">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="history" className="rounded-lg font-bold text-xs uppercase">Historial de Citas</TabsTrigger>
          <TabsTrigger value="purchases" className="rounded-lg font-bold text-xs uppercase">Historial de Compras</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <Card className="bg-admin-panel border-2 border-primary/10 rounded-3xl shadow-xl">
            <CardContent className="pt-6 space-y-3">
              {appointments && appointments.length > 0 ? (
                appointments.map((a: any) => (
                  <div key={a.id} className="p-4 bg-card rounded-xl border border-border flex justify-between items-center">
                    <div>
                      <p className="font-bold text-primary uppercase text-sm">{a.serviceName || "Servicio"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(a.appointmentDate).toLocaleDateString()} · {a.appointmentTime} · {a.staffName || "General"}
                      </p>
                    </div>
                    <Badge className="bg-primary text-white border-none text-[9px] font-black px-2 py-0.5">
                      {a.status?.toUpperCase()}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No se encontraron citas registradas.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="purchases">
          <Card className="bg-admin-panel border-2 border-primary/10 rounded-3xl shadow-xl">
            <CardContent className="pt-6 space-y-3">
              {clientSales && clientSales.length > 0 ? (
                clientSales.map((s: any) => (
                  <div key={s.id} className="p-4 bg-card rounded-xl border border-border flex justify-between items-center">
                    <div>
                      <p className="font-bold text-foreground text-sm uppercase">Venta #{s.id}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(s.createdAt).toLocaleDateString()} · {s.paymentMethod?.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary text-sm">${Math.floor(Number(s.finalTotal)).toLocaleString()}</p>
                      <Badge variant={s.status === 'paid' ? 'outline' : 'destructive'} className="text-[8px] font-bold">
                        {s.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No se encontraron ventas registradas.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
