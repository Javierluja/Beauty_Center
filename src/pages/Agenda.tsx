import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  MessageCircle,
  Clock,
  User,
  Scissors,
  Sparkles,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  no_show:   "bg-red-500/15 text-red-400 border-red-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

export default function Agenda() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    serviceId: "",
    staffName: "General",
    appointmentDate: new Date().toLocaleDateString('en-CA'),
    appointmentTime: "09:00",
    notes: "",
    status: "pending",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const dateFrom = new Date(year, month, 1).toLocaleDateString('en-CA');
  const dateTo = new Date(year, month + 1, 0).toLocaleDateString('en-CA');

  const { data: appointments, isLoading } = trpc.appointment.list.useQuery({
    dateFrom,
    dateTo,
  });

  const { data: clients } = trpc.customers.list.useQuery();
  const { data: services } = trpc.service.list.useQuery({ active: true });

  const createMutation = trpc.appointment.create.useMutation({
    onSuccess: () => {
      utils.appointment.list.invalidate();
      setDialogOpen(false);
      resetForm();
      toast({ title: "¡Cita agendada! 🌸" });
    },
  });

  const updateMutation = trpc.appointment.update.useMutation({
    onSuccess: () => {
      utils.appointment.list.invalidate();
      toast({ title: "Cita actualizada ✨" });
    },
  });

  function resetForm() {
    setForm({
      clientId: "",
      serviceId: "",
      staffName: "General",
      appointmentDate: new Date().toLocaleDateString('en-CA'),
      appointmentTime: "09:00",
      notes: "",
      status: "pending",
    });
  }

  function parseDateSafe(dateVal: any) {
    if (!dateVal) return null;
    try {
      // Forzamos que la fecha se lea como UTC para evitar saltos de día por zona horaria
      let dateStr = "";
      if (dateVal instanceof Date) {
        dateStr = dateVal.toISOString().split('T')[0];
      } else {
        dateStr = String(dateVal).split('T')[0];
      }
      // Creamos la fecha al mediodía para evitar problemas de redondeo
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d, 12, 0, 0);
      return isNaN(date.getTime()) ? null : date;
    } catch (e) {
      return null;
    }
  }

  const selectedDayAppointments = useMemo(() => {
    if (!appointments) return [];
    return appointments.filter(a => {
      // Comparación robusta por string YYYY-MM-DD
      const dateStr = typeof a.appointmentDate === 'string' ? a.appointmentDate.split('T')[0] : new Date(a.appointmentDate).toISOString().split('T')[0];
      const targetDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      return dateStr === targetDate;
    }).sort((a, b) => (a.appointmentTime || "").localeCompare(b.appointmentTime || ""));
  }, [appointments, selectedDay, month, year]);

  function getAppointmentsForDay(day: number) {
    if (!appointments) return [];
    return appointments.filter((appt) => {
      const d = parseDateSafe(appt.appointmentDate);
      return d?.getDate() === day && d?.getMonth() === month && d?.getFullYear() === year;
    });
  }

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const dayNames = ["L", "M", "M", "J", "V", "S", "D"];
  // Ajuste para que la semana empiece en Lunes (0=Lunes, 6=Domingo)
  const startingDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Agenda del Salón</h1>
          <p className="text-xs text-muted-foreground mt-1">Toca un día para ver el detalle</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 font-black shadow-lg h-12 w-full md:w-auto px-8 rounded-2xl">
              <Plus className="h-5 w-5 mr-2" /> NUEVA CITA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[95vw] rounded-3xl border-primary/20">
            <DialogHeader><DialogTitle className="font-black text-primary uppercase">Agendar Cita</DialogTitle></DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate({ ...form, clientId: Number(form.clientId), serviceId: Number(form.serviceId) });
            }} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium uppercase text-muted-foreground ml-1">Cliente</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger className="rounded-xl border-primary/10"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {clients?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-black uppercase text-slate-900 ml-1">Servicio</Label>
                <Select value={form.serviceId} onValueChange={(v) => setForm({ ...form, serviceId: v })}>
                  <SelectTrigger className="rounded-xl border-primary/10"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {services?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} - ${Math.floor(Number(s.price))}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-black uppercase text-slate-900 ml-1">Fecha</Label>
                  <Input type="date" value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} className="rounded-xl border-2 border-primary/10 h-12 font-bold" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-black uppercase text-slate-900 ml-1">Hora</Label>
                  <Input type="time" value={form.appointmentTime} onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })} className="rounded-xl border-2 border-primary/10 h-12 font-bold" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary font-black h-12 shadow-xl rounded-2xl mt-4" disabled={createMutation.isPending}>
                GUARDAR ✨
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* CALENDARIO MENSUAL */}
        <Card className="lg:col-span-7 border border-border shadow-xl rounded-2xl overflow-hidden bg-card">
          <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6 border-b border-border">
            <CardTitle className="font-bold text-foreground text-xl tracking-tight">
              {monthNames[month]} <span className="font-normal text-muted-foreground ml-1 text-lg">{year}</span>
            </CardTitle>
            <div className="flex gap-1 md:gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="text-primary hover:bg-primary/10"><ChevronLeft className="h-6 w-6" /></Button>
              <Button variant="ghost" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date().getDate()); }} className="font-black text-[10px] uppercase tracking-widest px-4">Hoy</Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="text-primary hover:bg-primary/10"><ChevronRight className="h-6 w-6" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <div className="grid grid-cols-7 gap-px md:gap-2">
              {dayNames.map((d, i) => <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-3 uppercase tracking-widest">{d}</div>)}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={i} className="min-h-[50px] md:min-h-[90px] opacity-20" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayAppts = getAppointmentsForDay(dayNum);
                const isToday = dayNum === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                const isSelected = dayNum === selectedDay;
                
                return (
                    <button 
                      key={i} 
                      onClick={() => setSelectedDay(dayNum)}
                      className={`
                        relative min-h-[50px] md:min-h-[100px] border rounded-xl md:rounded-2xl p-1 md:p-2 transition-all group flex flex-col items-center md:items-start
                        ${isSelected ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "bg-card border-border hover:border-primary/40 hover:bg-accent"}
                        ${isToday && !isSelected ? "ring-1 ring-primary/60 ring-offset-1 ring-offset-background" : ""}
                      `}
                    >
                    <span className={`text-base md:text-xl font-bold ${isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground"}`}>
                      {dayNum}
                    </span>
                    <div className="flex gap-0.5 mt-auto pb-1">
                      {dayAppts.slice(0, 3).map(a => (
                        <div key={a.id} className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-primary opacity-40"}`} />
                      ))}
                      {dayAppts.length > 3 && <span className={`text-[8px] font-black ${isSelected ? "text-white" : "text-primary opacity-40"}`}>+</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* RESUMEN DEL DÍA SELECCIONADO */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Resumen Día {selectedDay}
            </h2>
            <Badge variant="outline" className="font-black text-[10px] border-primary/20 text-primary">
              {selectedDayAppointments.length} CITAS
            </Badge>
          </div>

          <div className="space-y-3 h-full max-h-[600px] overflow-y-auto no-scrollbar pr-1">
            {isLoading ? <Skeleton className="h-40 w-full rounded-3xl" /> : selectedDayAppointments.length > 0 ? (
              selectedDayAppointments.map(appt => (
                <Card key={appt.id} className="border border-border hover:border-primary/30 transition-all rounded-xl overflow-hidden group bg-card">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm uppercase leading-none mb-2 tracking-tight">{appt.clientName || "General"}</p>
                        <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md w-fit">
                          <Scissors className="h-3 w-3 text-primary" /> {appt.serviceName}
                        </p>
                        {appt.clientPhone && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 mt-2 bg-green-50 text-green-700 hover:bg-green-100 font-black text-[9px] uppercase tracking-widest border border-green-200"
                            onClick={() => {
                              const d = parseDateSafe(appt.appointmentDate);
                              const time = String(appt.appointmentTime || "").slice(0, 5);
                              const msg = `Hola ${appt.clientName}! 🌸 Te escribimos de BeautyLife Center para recordar tu cita de ${appt.serviceName} el día ${d?.toLocaleDateString("es-ES")} a las ${time}. ¡Te esperamos! ✨`;
                              window.open(`https://wa.me/${appt.clientPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" /> Enviar Aviso
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xl font-black text-primary leading-none">{String(appt.appointmentTime || "").slice(0, 5)}</p>
                        <Badge className={`${STATUS_COLORS[appt.status]} border-none font-black text-[8px] h-4 mt-1 px-1.5`}>
                          {STATUS_LABELS[appt.status].toUpperCase()}
                        </Badge>
                      </div>
                      <Select 
                        value={appt.status} 
                        onValueChange={(v) => updateMutation.mutate({ id: appt.id, status: v })}
                      >
                        <SelectTrigger className="w-[100px] h-9 text-[10px] font-black border-primary/10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-20 text-center bg-muted/30 rounded-2xl border border-dashed border-border">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-xs text-muted-foreground">Día libre ✨</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
