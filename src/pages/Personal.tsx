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
  UserPlus,
  ShieldCheck,
  UserCircle,
  Mail,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Personal() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({
    name: "",
    email: "",
    password: "",
    role: "ventas"
  });

  const { data: users, isLoading } = trpc.user.list.useQuery();

  // Cambiado: Ahora usamos user.create (Administrativo) en lugar de auth.register (Público)
  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      setDialogOpen(false);
      setForm({ name: "", email: "", password: "", role: "ventas" });
      toast({ title: "¡Colaborador añadido! 🌸", description: "Ya puede iniciar sesión con sus credenciales." });
    },
    onError: (err) => {
      toast({ title: "Error al crear usuario", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      toast({ title: "Usuario eliminado" });
    }
  });

  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permUserId, setPermUserId] = useState<number | null>(null);
  const [perms, setPerms] = useState<Record<string, boolean>>({ gastos: true, productos: true, compras: true, agenda: true, avisos: true, ventas: true, sesiones: true, personal: false });

  const updatePerms = trpc.user.updatePermissions.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      setPermDialogOpen(false);
      toast({ title: "Permisos actualizados", description: "El menú del usuario cambiará en su próximo acceso." });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Personal y Accesos</h1>
          <p className="text-xs text-muted-foreground mt-1">Gestión de equipo y seguridad</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-black shadow-lg h-12 w-full md:w-auto px-8 rounded-2xl">
              <UserPlus className="h-5 w-5 mr-2" /> AÑADIR COLABORADOR
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[95vw] rounded-[2.5rem] border-2 border-primary/20 bg-admin-panel shadow-2xl">
            <DialogHeader><DialogTitle className="font-black text-primary uppercase flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> Nuevo Acceso</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-black uppercase text-slate-900 ml-1">Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Javier R." className="rounded-xl border-border bg-card font-medium h-12" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-black uppercase text-slate-900 ml-1">Email (Usuario)</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="javier@beautycenter.com" className="rounded-xl border-2 border-primary/10 text-slate-800 font-black h-12" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-black uppercase text-slate-900 ml-1">Contraseña Inicial</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="rounded-xl border-2 border-primary/10 text-slate-800 font-black h-12" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-black uppercase text-slate-900 ml-1">Rol de Usuario</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="rounded-xl border-primary/10 h-10 text-slate-800 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ventas">Ventas / Staff</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="admin_pro">Administrador Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-primary font-black h-14 shadow-xl rounded-2xl mt-4 uppercase group" disabled={createMutation.isPending}>
                {createMutation.isPending ? "CREANDO..." : <span className="flex items-center gap-2">OTORGAR ACCESO <Sparkles className="h-4 w-4" /></span>}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? [1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-3xl" />) : 
          users?.map(user => (
            <Card key={user.id} className="border border-border rounded-2xl shadow-lg hover:border-primary/40 transition-all bg-card group overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <UserCircle className="h-8 w-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-slate-900 text-xl uppercase truncate leading-none mb-2 tracking-tight">{user.name}</h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 truncate bg-slate-100 px-2 py-1 rounded-lg w-fit border border-slate-200">
                        <Mail className="h-3 w-3 text-primary" /> {user.email}
                      </p>
                    </div>
                  </div>
                  <Badge className={`border-none font-bold text-[9px] h-5 uppercase shrink-0 ${user.role === 'admin_pro' ? 'bg-primary text-primary-foreground' : user.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {user.role === 'admin_pro' ? 'Admin Pro' : user.role === 'admin' ? 'Administrador' : 'Ventas'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <p className="text-[10px] text-muted-foreground">Acceso Habilitado</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { 
                      setPermUserId(user.id); 
                      const p = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
                      setPerms(p || { gastos: true, productos: true, compras: true, agenda: true, avisos: true, ventas: true, sesiones: true, personal: false }); 
                      setPermDialogOpen(true); 
                    }} className="h-10 px-4 rounded-xl text-xs font-bold uppercase">
                      Permisos
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if(confirm("¿Quitar acceso a este usuario?")) deleteMutation.mutate(user.id) }} className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl border border-destructive/10">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent className="max-w-xs rounded-3xl bg-card border border-border">
          <DialogHeader><DialogTitle className="font-black uppercase">Permisos del Sistema</DialogTitle></DialogHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto no-scrollbar">
            {Object.entries(perms).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-3 border border-border rounded-xl">
                <span className="font-bold text-sm capitalize">Módulo {key}</span>
                <div onClick={() => setPerms({...perms, [key]: !val})} className={`h-6 w-11 rounded-full cursor-pointer relative transition-colors ${val ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                  <div className={`h-4 w-4 bg-background rounded-full absolute top-1 shadow-sm transition-transform ${val ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => updatePerms.mutate({ userId: permUserId!, permissions: JSON.stringify(perms) })} className="w-full bg-primary font-black uppercase rounded-xl h-12" disabled={updatePerms.isPending}>
            Guardar Permisos
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
