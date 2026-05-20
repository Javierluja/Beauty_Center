import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Sparkles,
  CheckCircle2,
  X,
  MessageCircle,
  Search,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Sesiones() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [sessionCount, setSessionCount] = useState("10");
  const [searchTermPacks, setSearchTermPacks] = useState("");

  const [schedulingPack, setSchedulingPack] = useState<any>(null);
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("");

  const { data: clients } = trpc.customers.list.useQuery();
  const { data: allPacks, isLoading } = trpc.session.listAll.useQuery();
  const { data: services } = trpc.service.list.useQuery({ active: true });

  const createPack = trpc.session.createPack.useMutation({
    onSuccess: () => {
      utils.session.listAll.invalidate();
      toast({ title: "¡Plan de sesiones creado! 🌸" });
      setShowForm(false);
      resetForm();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const createAppointment = trpc.appointment.create.useMutation({
    onSuccess: () => {
      utils.appointment.invalidate();
      toast({ title: "Cita agendada", description: "La próxima sesión ha sido registrada." });
    },
    onError: (err) => {
      toast({ title: "Error al agendar", description: err.message, variant: "destructive" });
    }
  });

  const createNotification = trpc.notification.create.useMutation({
    onSuccess: () => {
      utils.notification.invalidate();
    },
    onError: (err) => {
      toast({ title: "Error en aviso", description: err.message, variant: "destructive" });
    }
  });

  const useSession = trpc.session.useSession.useMutation({
    onSuccess: (res) => {
      utils.session.listAll.invalidate();
      utils.appointment.invalidate();
      toast({ title: "¡Sesión registrada! ✨", description: `Quedan ${res.remaining} sesiones.` });
      setSchedulingPack(null);
      setNextDate("");
      setNextTime("");
    },
    onError: (err) => {
      toast({ title: "Error al registrar sesión", description: err.message, variant: "destructive" });
    }
  });

  const updateAppointment = trpc.appointment.update.useMutation({
    onSuccess: () => {
      utils.appointment.invalidate();
    },
    onError: (err) => {
      toast({ title: "Error al actualizar cita", description: err.message, variant: "destructive" });
    }
  });

  const handleUseSession = (pack: any) => {
    if (pack.remainingSessions <= 0) return;
    
    const pendingAppt = allAppointments?.find(a => a.packId === pack.id && a.status === "pending");

    if (pack.remainingSessions === 1) {
      // Es la última sesión, se marca como consumida directamente
      useSession.mutate({ packId: pack.id });
      // Se completa la cita pendiente del pack
      if (pendingAppt) {
        updateAppointment.mutate({ id: pendingAppt.id, status: "completed" });
      }
    } else {
      // Quedan más sesiones, se abre el diálogo para agendar la próxima
      setSchedulingPack(pack);
    }
  };

  function resetForm() {
    setSelectedClientId("");
    setSelectedServiceId("");
    setCustomTitle("");
    setSessionCount("10");
  }

  const { data: allAppointments } = trpc.appointment.list.useQuery();

  const activePacks = allPacks?.filter(p => {
    const hasRemaining = p.remainingSessions > 0;
    const hasPendingAppointment = allAppointments?.some(a => a.packId === p.id && a.status === "pending");
    const matchesSearch = !searchTermPacks || clients?.find(c => c.id === p.clientId)?.name.toLowerCase().includes(searchTermPacks.toLowerCase());
    return (hasRemaining || hasPendingAppointment) && matchesSearch;
  }) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-foreground tracking-tight">
            Control de Sesiones <Sparkles className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Gestiona packs de tratamiento personalizados</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary/90 font-bold shadow-md"
        >
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Cancelar" : "Nuevo Plan"}
        </Button>
      </div>

      {showForm && (
        <Card className="border border-border bg-card shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border px-6 py-4">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Crear nuevo plan de sesiones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest ml-1">Cliente</label>
                <select
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Elegir cliente...</option>
                  {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest ml-1">Servicio Base</label>
                <select
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    const s = services?.find(srv => srv.id.toString() === e.target.value);
                    if (s) setCustomTitle(s.name);
                  }}
                >
                  <option value="">Elegir servicio...</option>
                  {services?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest ml-1">Nombre del Plan</label>
                <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Ej: Pack 10 Masajes" className="border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest ml-1">N° Sesiones</label>
                <Input type="number" value={sessionCount} onChange={(e) => setSessionCount(e.target.value)} className="border-border" />
              </div>
            </div>
            <Button
              onClick={() => {
                if (!selectedClientId || !customTitle) {
                  toast({ title: "Atención", description: "Completa cliente y nombre del plan", variant: "destructive" });
                  return;
                }
                createPack.mutate({
                  clientId: Number(selectedClientId),
                  serviceId: Number(selectedServiceId) || services?.[0]?.id || 1,
                  customTitle,
                  totalSessions: Number(sessionCount) || 10
                });
              }}
              disabled={createPack.isPending}
              className="bg-primary hover:bg-primary/90 font-bold h-11 px-8 shadow-lg w-full md:w-auto"
            >
              {createPack.isPending ? "GUARDANDO..." : "CREAR PLAN ✨"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente con sesiones activas..."
          className="pl-11 h-12 bg-card border border-border rounded-xl font-medium placeholder:text-muted-foreground"
          value={searchTermPacks}
          onChange={(e) => setSearchTermPacks(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          Sesiones Activas
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">{activePacks.length}</Badge>
        </h2>

        <div className="grid gap-4">
          {isLoading ? (
            <Skeleton className="h-40 w-full rounded-2xl bg-muted" />
          ) : activePacks.map(pack => {
            const client = clients?.find(c => c.id === pack.clientId);
            const progress = ((pack.totalSessions - pack.remainingSessions) / pack.totalSessions) * 100;
            return (
              <div key={pack.id} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">{client?.name}</h3>
                    <span className="text-[10px] text-muted-foreground mt-1 bg-muted px-3 py-1 rounded-full inline-block">
                      {pack.customTitle} · {new Date(pack.purchaseDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-primary">
                      {pack.totalSessions - pack.remainingSessions}
                      <span className="text-lg text-muted-foreground font-medium ml-1">/ {pack.totalSessions}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground bg-primary/5 px-3 py-1.5 rounded-lg">
                      Realizadas: <strong className="text-primary">{pack.totalSessions - pack.remainingSessions}</strong> · Faltan: <strong className="text-primary">{pack.remainingSessions}</strong> 🌸
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-muted-foreground hover:text-foreground hover:border-primary/30 font-medium"
                        onClick={() => {
                          const msg = `Hola ${client?.name}! 🌸 Te escribo de Beauty Center. Registramos una sesión de ${pack.customTitle}. Te quedan ${pack.remainingSessions} sesiones. ¡Te esperamos! ✨`;
                          window.open(`https://wa.me/${client?.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        className={`font-bold px-5 shadow-md ${pack.remainingSessions === 0 ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary hover:bg-primary/90"}`}
                        onClick={() => handleUseSession(pack)}
                        disabled={useSession.isPending || pack.remainingSessions === 0}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        {pack.remainingSessions === 0 ? "COMPLETADO" : `SESIÓN #${pack.totalSessions - pack.remainingSessions + 1}`}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!schedulingPack} onOpenChange={(open) => !open && setSchedulingPack(null)}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> Registrar Sesión
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <p className="text-sm text-muted-foreground">
              Agendando próxima cita para <strong className="text-foreground">{clients?.find(c => c.id === schedulingPack?.clientId)?.name}</strong>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Fecha *</label>
                <Input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="rounded-xl border-border h-12 font-medium" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Hora *</label>
                <Input type="time" value={nextTime} onChange={e => setNextTime(e.target.value)} className="rounded-xl border-border h-12 font-medium" />
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-border">
              <Button
                onClick={() => {
                  if (!schedulingPack) return;
                  if (!nextDate || !nextTime) {
                    toast({ title: "Atención", description: "La fecha y hora son obligatorias.", variant: "destructive" });
                    return;
                  }
                  useSession.mutate({ packId: schedulingPack.id });
                  createAppointment.mutate({
                    clientId: schedulingPack.clientId,
                    serviceId: schedulingPack.serviceId,
                    packId: schedulingPack.id,
                    appointmentDate: nextDate,
                    appointmentTime: nextTime,
                    status: "pending",
                    notes: `Sesión programada desde pack: ${schedulingPack.customTitle}`
                  });
                  const pendingAppt = allAppointments?.find(a => a.packId === schedulingPack.id && a.status === "pending");
                  if (pendingAppt) {
                    updateAppointment.mutate({ id: pendingAppt.id, status: "completed" });
                  }
                  const client = clients?.find(c => c.id === schedulingPack.clientId);
                  createNotification.mutate({
                    clientId: schedulingPack.clientId,
                    type: "appointment_reminder",
                    message: `Hola ${client?.name || ""}! 🌸 Te recordamos tu próxima cita de ${schedulingPack.customTitle} el día ${nextDate} a las ${nextTime}. ¡Te esperamos! ✨`
                  });
                }}
                disabled={useSession.isPending || createAppointment.isPending || !nextDate || !nextTime}
                className="w-full bg-primary hover:bg-primary/90 font-bold h-12 rounded-xl shadow-lg uppercase"
              >
                {useSession.isPending || createAppointment.isPending ? "Procesando..." : "Registrar y Agendar ✨"}
              </Button>
              <Button variant="ghost" onClick={() => setSchedulingPack(null)} className="w-full h-10 font-medium text-muted-foreground hover:text-foreground">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
