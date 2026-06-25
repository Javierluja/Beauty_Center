import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Bell,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  CalendarDays,
  User,
  Sparkles,
  Plus,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Notificaciones() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    clientId: "",
    message: "",
  });

  const d = new Date();
  const defaultMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const monthsList = Array.from({ length: 12 }).map((_, i) => {
    const date = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const val = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return { val, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  const { data: clients } = trpc.customers.list.useQuery();

  const { data: pendingNotifications, isLoading: pendingLoading } =
    trpc.notification.list.useQuery({ sent: 0 });

  const { data: sentNotifications, isLoading: sentLoading } =
    trpc.notification.list.useQuery({ sent: 1 });

  const { data: upcomingAppointments } =
    trpc.appointment.upcoming.useQuery(7);

  const markAsSent = trpc.notification.markAsSent.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      toast({ title: "Notificación marcada como enviada ✨" });
    },
  });

  const createNotification = trpc.notification.create.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      toast({ title: "Recordatorio creado con éxito 🌸" });
    },
  });

  // FUNCIÓN DE PARSEO ROBUSTA
  function parseDateSafe(dateVal: any) {
    if (!dateVal) return null;
    try {
      let dateStr = "";
      if (dateVal instanceof Date) {
        dateStr = dateVal.toISOString().split('T')[0];
      } else {
        dateStr = String(dateVal).split('T')[0];
      }
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d, 12, 0, 0);
      return isNaN(date.getTime()) ? null : date;
    } catch (e) {
      return null;
    }
  }

  function handleQuickReminder(appt: any) {
    const d = parseDateSafe(appt.appointmentDate);
    if (!d) return;
    
    const time = String(appt.appointmentTime || "").slice(0, 5);
    const message = `Hola ${appt.clientName}! 🌸 Te recordamos tu cita de ${appt.serviceName} el ${d.toLocaleDateString("es-ES")} a las ${time}. ¡Te esperamos en BeautyLife Center! ✨`;
    
    createNotification.mutate({
      clientId: appt.clientId,
      appointmentId: appt.id,
      type: "appointment_reminder",
      message,
    });

    // Abrir WhatsApp también
    if (appt.clientPhone && confirm(`¿Deseas enviar el WhatsApp a ${appt.clientName} ahora?`)) {
      window.open(`https://wa.me/${appt.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Avisos y Notificaciones</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gestiona recordatorios y mantén a tus clientes informados
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-black shadow-lg h-12 w-full md:w-auto px-8 rounded-2xl">
              <Plus className="h-5 w-5 mr-2" /> NUEVO MENSAJE LIBRE
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[95vw] rounded-3xl border-primary/20 bg-admin-panel">
            <DialogHeader><DialogTitle className="font-black text-primary uppercase flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Crear Aviso</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createNotification.mutate({
                clientId: Number(customForm.clientId),
                type: "custom_message",
                message: customForm.message,
              });
              setDialogOpen(false);
              setCustomForm({ clientId: "", message: "" });
            }} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-black uppercase text-slate-900 ml-1">Cliente</Label>
                <Select value={customForm.clientId} onValueChange={(v) => setCustomForm({ ...customForm, clientId: v })}>
                  <SelectTrigger className="rounded-xl border-primary/10"><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-black uppercase text-slate-900 ml-1">Mensaje a enviar</Label>
                <Textarea 
                  value={customForm.message} 
                  onChange={(e) => setCustomForm({ ...customForm, message: e.target.value })} 
                  className="rounded-xl border-primary/10 h-24 resize-none" 
                  placeholder="Ej: Hola, tenemos una promo especial para ti..." 
                  required 
                />
              </div>
              <Button type="submit" className="w-full bg-primary font-black h-12 shadow-xl rounded-2xl mt-4" disabled={createNotification.isPending}>
                GUARDAR EN PENDIENTES 📝
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* PANEL DE CITAS PRÓXIMAS */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-border shadow-lg overflow-hidden bg-card rounded-xl">
            <CardHeader className="border-b border-border px-5 py-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Próximas Citas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-3">
              {!upcomingAppointments ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map((appt) => {
                    const d = parseDateSafe(appt.appointmentDate);
                    return (
                      <div key={appt.id} className="p-3.5 bg-card rounded-xl border border-border/50 hover:border-primary/40 transition-all">
                         <div className="flex items-center justify-between mb-1.5">
                           <p className="font-semibold text-foreground truncate text-sm">{appt.clientName || "General"}</p>
                           <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{d ? d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '--'}</span>
                         </div>
                         <p className="text-[10px] text-muted-foreground mb-3">{appt.serviceName}</p>
                         <Button
                           size="sm"
                           variant="outline"
                           className="w-full h-8 text-[10px] font-semibold border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                           onClick={() => handleQuickReminder(appt)}
                         >
                           <Send className="h-3 w-3 mr-1" /> CREAR RECORDATORIO
                         </Button>
                       </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-muted-foreground">No hay citas para hoy o mañana</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* LISTA DE NOTIFICACIONES */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="bg-muted p-1 mb-6 h-12 w-full grid grid-cols-2 gap-2 rounded-xl border border-border">
              <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-white font-black text-xs">
                <Clock className="h-4 w-4 mr-2" /> PENDIENTES ({pendingNotifications?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="sent" className="data-[state=active]:bg-primary data-[state=active]:text-white font-black text-xs">
                <CheckCircle2 className="h-4 w-4 mr-2" /> ENVIADAS ({sentNotifications?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-2 border-primary/10 shadow-2xl bg-admin-panel rounded-3xl overflow-hidden">
                <CardContent className="pt-6">
                  {pendingLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                    </div>
                  ) : pendingNotifications && pendingNotifications.length > 0 ? (
                    <div className="space-y-4">
                      {pendingNotifications.map((notif) => (
                        <div key={notif.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-card rounded-xl border border-border group hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-5 mb-4 md:mb-0">
                            <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg">
                              <Bell className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-foreground leading-tight tracking-tight">{notif.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1.5 bg-muted px-2 py-0.5 rounded-md w-fit border border-border">
                                {notif.type === "appointment_reminder" ? "Recordatorio de Cita" : "Aviso General"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 font-black px-6 shadow-sm"
                              onClick={() => {
                                const client = clients?.find(c => c.id === notif.clientId);
                                if (client?.phone) {
                                  window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(notif.message)}`, '_blank');
                                } else {
                                  toast({ title: "Sin teléfono", description: "El cliente no tiene teléfono registrado.", variant: "destructive" });
                                }
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" /> WHATSAPP
                            </Button>
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-white font-black px-6 shadow-md"
                              onClick={() => markAsSent.mutate(notif.id)}
                              disabled={markAsSent.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> MARCAR LISTO
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-muted/20 rounded-2xl border border-dashed border-border">
                      <Bell className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-xs text-muted-foreground">Bandeja de entrada limpia ✨</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sent" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-end mb-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[200px] rounded-xl bg-card border-primary/20 shadow-sm font-bold capitalize">
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl capitalize">
                    {monthsList.map(m => (
                      <SelectItem key={m.val} value={m.val}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Card className="border-2 border-primary/10 shadow-xl bg-admin-panel rounded-3xl overflow-hidden">
                <CardContent className="pt-6">
                  {(() => {
                    const filtered = sentNotifications?.filter((notif) => {
                      const d = new Date(notif.sentAt || notif.createdAt);
                      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                      return val === selectedMonth;
                    });
                    
                    if (!filtered || filtered.length === 0) {
                      return <div className="text-center py-20 italic text-slate-400 font-black uppercase tracking-widest">No hay envíos este mes</div>;
                    }
                    
                    return (
                      <div className="space-y-4">
                        {filtered.map((notif) => (
                        <div key={notif.id} className="flex items-center justify-between p-4 bg-slate-100/50 rounded-2xl border-2 border-slate-100 shadow-sm">
                          <div className="flex items-center gap-5">
                            <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-700 uppercase tracking-tight">{notif.message}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest italic">
                                Enviado: {notif.sentAt ? new Date(notif.sentAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "---"}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-slate-200 text-slate-600 border-none font-black text-[9px] px-3 py-1">ENVIADA</Badge>
                        </div>
                      ))}
                    </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
