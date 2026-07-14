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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  User,
  MessageCircle,
  Eye,
  History,
  ShoppingBag,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Clientes() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", birthDate: "", rut: "", address: "", profession: "" });

  const { data: clients, isLoading } = trpc.customers.list.useQuery(
    search ? search : undefined
  );

  // Queries para el historial
  const { data: history } = trpc.appointment.list.useQuery(
    { clientId: selectedClient?.id },
    { enabled: !!selectedClient && detailOpen }
  );

  const { data: sales } = trpc.sale.list.useQuery(
    { clientId: selectedClient?.id },
    { enabled: !!selectedClient && detailOpen }
  );

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      setDialogOpen(false);
      resetForm();
      toast({ title: "¡Cliente registrado! 🌸" });
    },
  });

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      setDialogOpen(false);
      resetForm();
      toast({ title: "Datos actualizados ✨" });
    },
  });

  const deleteMutation = trpc.customers.delete.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      toast({ title: "Cliente eliminado" });
    },
  });

  function resetForm() {
    setForm({ name: "", phone: "", email: "", notes: "", birthDate: "", rut: "", address: "", profession: "" });
    setEditingId(null);
  }

  function handleEdit(client: any) {
    setEditingId(client.id);
    
    let formattedDate = "";
    if (client.birthDate) {
      formattedDate = typeof client.birthDate === 'string' 
        ? client.birthDate.split('T')[0] 
        : new Date(client.birthDate).toISOString().split('T')[0];
    }

    setForm({
      name: client.name,
      phone: client.phone,
      email: client.email || "",
      notes: client.notes || "",
      birthDate: formattedDate,
      rut: client.rut || "",
      address: client.address || "",
      profession: client.profession || "",
    });
    setDialogOpen(true);
  }

  function handleViewDetail(client: any) {
    setSelectedClient(client);
    setDetailOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, ...form });
    else createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Clientes</h1>
          <p className="text-xs text-muted-foreground mt-1">Base de datos y fidelización</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-primary hover:bg-primary/90 font-black shadow-lg h-12 w-full md:w-auto px-8 rounded-2xl">
              <Plus className="h-5 w-5 mr-2" /> NUEVO CLIENTE
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[95vw] rounded-3xl">
            <DialogHeader><DialogTitle className="font-black text-primary uppercase">Registro de Cliente</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Nombre Completo *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Ana García" className="rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Teléfono / WhatsApp *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ej. 56912345678" className="rounded-xl" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">RUT</Label>
                <Input value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} placeholder="Ej. 12345678-9" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Dirección</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Ej. Av. Siempre Viva 123" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Profesión</Label>
                <Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} placeholder="Ej. Arquitecta" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ana@ejemplo.com" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Notas / Alergias</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ej. Alérgica al tinte..." className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase">Fecha de Nacimiento</Label>
                <Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full bg-primary font-black h-12 shadow-xl rounded-2xl mt-4 uppercase">
                {editingId ? "Actualizar" : "Crear Cliente"} ✨
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
        <Input placeholder="Buscar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12 h-12 rounded-xl border border-border bg-card font-medium placeholder:text-muted-foreground" />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-[10px] uppercase font-semibold text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="border-b border-primary/5"><td colSpan={3} className="p-4"><Skeleton className="h-12 w-full rounded-xl" /></td></tr>
                ))
              ) : (clients || []).length === 0 ? (
                <tr><td colSpan={3} className="p-10 text-center text-muted-foreground font-black uppercase">No hay clientes registrados</td></tr>
              ) : (
                (clients || []).map(client => (
                  <tr key={client.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg">
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase tracking-tight text-base">{client.name}</p>
                          {client.notes && <p className="text-[10px] text-slate-500 font-black uppercase mt-1 bg-slate-200 px-2 py-0.5 rounded-md inline-block">{client.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground text-sm">{client.phone}</p>
                      <p className="text-[10px] text-muted-foreground">{client.email || 'Sin email'}</p>
                      {client.birthDate && (
                        <p className="text-[10px] font-black text-pink-500 uppercase mt-1">
                          🎂 {(() => {
                            const dateStr = typeof client.birthDate === 'string' ? client.birthDate : new Date(client.birthDate).toISOString();
                            const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
                            return new Date(y, m - 1, d).toLocaleDateString();
                          })()}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetail(client)} className="h-9 w-9 text-primary hover:bg-primary/10 rounded-lg border border-primary/10"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" asChild className="h-9 w-9 text-green-600 hover:bg-green-50 rounded-lg border border-green-200">
                          <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /></a>
                        </Button>
                        {client.birthDate && (
                          <Button variant="ghost" size="icon" asChild className="h-9 w-9 text-pink-500 hover:bg-pink-50 rounded-lg border border-pink-200">
                            <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${client.name.split(' ')[0]}! 🌸 Te enviamos un gran saludo de cumpleaños de parte de todo el equipo de BeautyLife Center. ¡Que tengas un hermoso día! ✨`)}`} target="_blank" rel="noreferrer">
                              <span className="text-sm">🎂</span>
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(client)} className="h-9 w-9 text-primary hover:bg-primary/10 rounded-lg border border-primary/10"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if(confirm("¿Eliminar?")) deleteMutation.mutate(client.id) }} className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-lg border border-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE HISTORIAL DETALLADO */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl w-[95vw] rounded-3xl p-0 overflow-hidden border-primary/20">
          <div className="bg-primary-gradient p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">{selectedClient?.name}</h2>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{selectedClient?.phone} · {selectedClient?.email || 'Sin Email'}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 pb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-3">Información Personal</h3>
            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">RUT</p>
                <p className="text-sm font-semibold">{selectedClient?.rut || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Dirección</p>
                <p className="text-sm font-semibold">{selectedClient?.address || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Profesión</p>
                <p className="text-sm font-semibold">{selectedClient?.profession || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Cumpleaños</p>
                <p className="text-sm font-semibold">
                  {selectedClient?.birthDate ? (() => {
                    const dateStr = typeof selectedClient.birthDate === 'string' ? selectedClient.birthDate : new Date(selectedClient.birthDate).toISOString();
                    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
                    return new Date(y, m - 1, d).toLocaleDateString();
                  })() : '-'}
                </p>
              </div>
              
              {/* COMPUTED FIRST SERVICE */}
              {(() => {
                const firstAppt = history && history.length > 0 
                  ? [...history].sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())[0]
                  : null;
                return (
                  <>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-pink-500">1er Servicio</p>
                      <p className="text-sm font-semibold text-pink-600">{firstAppt ? firstAppt.serviceName : '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-pink-500">Fecha 1er Servicio</p>
                      <p className="text-sm font-semibold text-pink-600">{firstAppt ? new Date(firstAppt.appointmentDate).toLocaleDateString() : '-'}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          
          <Tabs defaultValue="history" className="p-4 pt-2">
            <TabsList className="grid grid-cols-2 bg-primary/5 p-1 rounded-2xl h-12 mb-6">
              <TabsTrigger value="history" className="rounded-xl font-black text-xs uppercase flex items-center gap-2"><History className="h-4 w-4" /> Citas</TabsTrigger>
              <TabsTrigger value="sales" className="rounded-xl font-black text-xs uppercase flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Compras</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {history?.length ? history.map(appt => (
                <div key={appt.id} className="p-4 bg-card rounded-xl border border-border flex justify-between items-center">
                  <div>
                    <p className="font-black text-primary uppercase text-sm">{appt.serviceName}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" /> {new Date(appt.appointmentDate).toLocaleDateString()} · {appt.appointmentTime}
                    </p>
                  </div>
                  <Badge className="bg-primary text-white border-none text-[8px] font-black px-2 py-1">{appt.status.toUpperCase()}</Badge>
                </div>
              )) : <p className="text-center py-10 text-xs font-black text-slate-400 uppercase italic">No hay citas registradas</p>}
            </TabsContent>

            <TabsContent value="sales" className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {sales?.length ? sales.map(sale => (
                <div key={sale.id} className="p-4 bg-card rounded-xl border border-border flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground uppercase text-sm">Venta #{sale.id}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <ShoppingBag className="h-3 w-3" /> {new Date(sale.createdAt).toLocaleDateString()} · {sale.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary text-lg">${Math.floor(Number(sale.finalTotal)).toLocaleString()}</p>
                  </div>
                </div>
              )) : <p className="text-center py-10 text-xs font-black text-slate-400 uppercase italic">No hay ventas registradas</p>}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
