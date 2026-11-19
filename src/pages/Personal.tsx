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
  Activity,
  Monitor,
  ReceiptText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SYSTEM_MODULES = [
  { key: "agenda", label: "Agenda de Citas", desc: "Gestión de citas y reservas" },
  { key: "avisos", label: "Avisos", desc: "Campañas y notificaciones" },
  { key: "ventas", label: "Punto de Venta", desc: "Emisión de comandas y ventas" },
  { 
    key: "cierre_caja", 
    label: "Cierre de Caja", 
    desc: "Arqueo semanal/mensual y exportación Excel (Solo Admin por defecto)",
    badge: "Nuevo"
  },
  { key: "compras", label: "Compras", desc: "Facturas e insumos de proveedores" },
  { key: "sesiones", label: "Sesiones", desc: "Control de packs de tratamientos" },
  { key: "productos", label: "Productos", desc: "Inventario y control de stock" },
  { key: "servicios", label: "Servicios", desc: "Catálogo y tarifas de estética" },
  { key: "cuentas", label: "Cuentas", desc: "Balance y abonos de clientes" },
  { key: "clientes", label: "Clientes", desc: "Fichas e historial de clientes" },
  { key: "gastos", label: "Gastos", desc: "Egresos y costos operativos" },
  { key: "personal", label: "Personal", desc: "Administración de usuarios (Solo Admin Pro)" },
];

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
  const { data: logs, isLoading: loadingLogs } = trpc.user.accessLogs.useQuery();

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
  const [permUser, setPermUser] = useState<any | null>(null);
  const [perms, setPerms] = useState<Record<string, boolean>>({});

  function handleOpenPerms(targetUser: any) {
    setPermUser(targetUser);
    setPermUserId(targetUser.id);
    let p: any = {};
    try {
      p = typeof targetUser.permissions === "string" ? JSON.parse(targetUser.permissions) : targetUser.permissions;
    } catch {}

    const isTargetAdmin = targetUser.role === "admin" || targetUser.role === "admin_pro";
    const initialPerms: Record<string, boolean> = {};

    SYSTEM_MODULES.forEach((mod) => {
      if (p && p[mod.key] !== undefined) {
        initialPerms[mod.key] = Boolean(p[mod.key]);
      } else {
        if (mod.key === "personal") {
          initialPerms[mod.key] = targetUser.role === "admin_pro";
        } else if (mod.key === "cierre_caja") {
          initialPerms[mod.key] = isTargetAdmin;
        } else {
          initialPerms[mod.key] = true;
        }
      }
    });

    setPerms(initialPerms);
    setPermDialogOpen(true);
  }

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
              <CardContent className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <UserCircle className="h-7 w-7 md:h-8 md:w-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-foreground text-lg md:text-xl uppercase truncate leading-none mb-1 md:mb-2 tracking-tight">{user.name}</h3>
                      <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5 truncate bg-muted px-2 py-1 rounded-lg w-fit border border-border">
                        <Mail className="h-3 w-3 text-primary shrink-0" /> <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                  </div>
                  <Badge className={`border-none font-bold text-[9px] h-5 px-1.5 md:px-2.5 uppercase shrink-0 ${user.role === 'admin_pro' ? 'bg-primary text-primary-foreground' : user.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {user.role === 'admin_pro' ? 'Admin Pro' : user.role === 'admin' ? 'Administrador' : 'Ventas'}
                  </Badge>
                </div>

                {/* Estado rápido de Cierre de Caja */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {user.role === 'admin_pro' || user.role === 'admin' ? (
                    <Badge variant="outline" className="text-[10px] bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300 font-bold flex items-center gap-1">
                      <ReceiptText className="h-3 w-3 text-teal-600" /> Cierre de Caja Habilitado (Admin)
                    </Badge>
                  ) : (
                    (() => {
                      let up: any = {};
                      try {
                        up = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
                      } catch {}
                      const hasCierre = up?.cierre_caja === true;
                      return (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold flex items-center gap-1 ${
                            hasCierre
                              ? "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-400"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          <ReceiptText className="h-3 w-3" />
                          {hasCierre ? "Cierre de Caja Habilitado" : "Cierre de Caja Deshabilitado"}
                        </Badge>
                      );
                    })()
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                  <p className="text-[9px] md:text-[10px] text-muted-foreground font-semibold">Acceso Habilitado</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenPerms(user)} className="h-9 md:h-10 px-3 md:px-4 rounded-xl text-[10px] md:text-xs font-bold uppercase border-primary/20 hover:bg-primary/5 text-primary">
                      Permisos
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if(confirm("¿Quitar acceso a este usuario?")) deleteMutation.mutate(user.id) }} className="h-9 w-9 md:h-10 md:w-10 text-destructive hover:bg-destructive/10 rounded-xl border border-destructive/10">
                      <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-6 w-6 text-primary" />
          <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Historial de Accesos</h2>
        </div>
        
        <Card className="border-border shadow-xl rounded-3xl overflow-hidden bg-card/50">
          <CardContent className="p-0 overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm md:text-base border-collapse">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-black uppercase text-xs text-muted-foreground w-1/4">Fecha / Hora</th>
                  <th className="px-6 py-4 font-black uppercase text-xs text-muted-foreground w-1/3">Usuario</th>
                  <th className="px-6 py-4 font-black uppercase text-xs text-muted-foreground">Acción</th>
                  <th className="px-6 py-4 font-black uppercase text-xs text-muted-foreground text-right">Dirección IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingLogs ? (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Cargando registros...</td></tr>
                ) : logs?.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground font-medium">No hay registros de acceso.</td></tr>
                ) : (
                  logs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-xs text-slate-600 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-5 w-5 text-primary" />
                          <div className="flex flex-col">
                            <span className="font-bold text-sm uppercase">{log.userName}</span>
                            <span className="text-[10px] text-muted-foreground">{log.userEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-bold text-[10px] uppercase">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded-lg ml-auto w-fit">
                          <Monitor className="h-3 w-3" /> {log.ipAddress || "Desconocida"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-3xl bg-card border border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-foreground uppercase tracking-tight flex items-center justify-between">
              <span>Permisos del Sistema</span>
              {permUser && (
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">
                  {permUser.name} ({permUser.role === 'admin_pro' ? 'Admin Pro' : permUser.role === 'admin' ? 'Admin' : 'Ventas'})
                </Badge>
              )}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Habilita o deshabilita los módulos a los que este colaborador tiene acceso.
            </p>
          </DialogHeader>

          <div className="space-y-2 py-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
            {SYSTEM_MODULES.map((mod) => {
              const val = perms[mod.key] ?? false;
              const isCierre = mod.key === "cierre_caja";
              return (
                <div
                  key={mod.key}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCierre
                      ? "border-teal-400 bg-teal-50/60 dark:bg-teal-950/40 dark:border-teal-700 shadow-sm"
                      : "border-border bg-card hover:border-primary/20"
                  }`}
                >
                  <div className="space-y-0.5 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs md:text-sm text-foreground">
                        {mod.label}
                      </span>
                      {mod.badge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-teal-600 text-white shadow-xs">
                          {mod.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {mod.desc}
                    </p>
                  </div>

                  {/* Toggle switch */}
                  <div
                    onClick={() => setPerms({ ...perms, [mod.key]: !val })}
                    className={`h-6 w-11 rounded-full cursor-pointer relative shrink-0 transition-colors ${
                      val
                        ? isCierre
                          ? "bg-teal-600"
                          : "bg-primary"
                        : "bg-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 bg-background rounded-full absolute top-1 shadow-sm transition-transform ${
                        val ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            onClick={() =>
              updatePerms.mutate({
                userId: permUserId!,
                permissions: JSON.stringify(perms),
              })
            }
            className="w-full bg-primary font-black uppercase rounded-2xl h-12 shadow-lg"
            disabled={updatePerms.isPending}
          >
            {updatePerms.isPending ? "Guardando..." : "Guardar Permisos"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
