import { trpc } from "@/providers/trpc";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  UserPlus, 
  UserCog, 
  Mail, 
  User as UserIcon, 
  ShieldCheck,
  Plus,
  X
} from "lucide-react";

export default function Usuarios() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin_pro" | "admin" | "ventas">("ventas");

  const { data: users, isLoading } = trpc.user.list.useQuery();

  const createUserMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      toast({ title: "Usuario creado correctamente 👤" });
      setShowAddForm(false);
      setNewName("");
      setNewEmail("");
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate();
      toast({ title: "Rol actualizado correctamente" });
    },
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin_pro":
        return <Badge className="bg-primary">Adm Pro</Badge>;
      case "admin":
        return <Badge variant="secondary">Adm</Badge>;
      case "ventas":
        return <Badge variant="outline">Ventas</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Gestión de Usuarios</h1>
          <p className="text-xs text-muted-foreground mt-1">Controla los niveles de acceso de tu equipo.</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90 font-black shadow-lg h-12 w-full md:w-auto px-8 rounded-2xl">
          <UserPlus className="h-5 w-5 mr-2" /> NUEVO USUARIO
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-2 border-primary/20 bg-admin-panel shadow-2xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-slate-100 border-b-2 border-slate-200">
            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Agregar nuevo personal</CardTitle>
            <CardDescription className="text-xs text-slate-500 font-black italic uppercase">El usuario podrá entrar con este correo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-900 ml-1">Nombre Completo</label>
                <Input 
                  placeholder="Ej: Juan Pérez" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl border-2 border-slate-100 h-12 font-black text-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-900 ml-1">Correo Electrónico</label>
                <Input 
                  type="email" 
                  placeholder="email@ejemplo.com" 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="rounded-xl border-2 border-slate-100 h-12 font-black text-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-900 ml-1">Rol Asignado</label>
                <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                  <SelectTrigger className="rounded-xl border-2 border-slate-100 h-12 font-black text-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    <SelectItem value="admin_pro">Adm Pro</SelectItem>
                    <SelectItem value="admin">Adm</SelectItem>
                    <SelectItem value="ventas">Ventas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => createUserMutation.mutate({ name: newName, email: newEmail, role: newRole })}
                disabled={!newName || !newEmail || createUserMutation.isPending}
                className="bg-primary hover:bg-primary/90 font-black px-8 rounded-xl h-12 shadow-lg uppercase text-xs"
              >
                {createUserMutation.isPending ? "Guardando..." : "Guardar Usuario"}
              </Button>
              <Button variant="ghost" onClick={() => setShowAddForm(false)} className="font-black text-slate-500 uppercase text-xs hover:bg-slate-100 rounded-xl h-12 px-6">
                <X className="h-4 w-4 mr-2" /> Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-admin-panel">
        <CardHeader className="bg-slate-100 border-b-2 border-slate-200 p-8">
          <CardTitle className="text-sm font-black text-slate-900 uppercase flex items-center gap-2 tracking-tight">
            <UserCog className="h-6 w-6 text-primary" />
            Lista de Personal Activo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 p-8">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-[11px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-5">Usuario</th>
                    <th className="px-6 py-5">Email</th>
                    <th className="px-6 py-5">Rol Actual</th>
                    <th className="px-6 py-5 text-right">Ajustar Permisos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {users?.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-100 transition-colors">
                    <td className="px-6 py-5 font-black text-slate-900 uppercase text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-slate-800" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-5">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-5 text-right">
                      <Select
                        defaultValue={user.role}
                        onValueChange={(newRole) =>
                          updateRoleMutation.mutate({
                            userId: user.id,
                            role: newRole as any,
                          })
                        }
                      >
                        <SelectTrigger className="w-[150px] ml-auto rounded-xl border-2 border-slate-100 h-10 font-black text-xs uppercase text-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-2">
                          <SelectItem value="admin_pro">Adm Pro</SelectItem>
                          <SelectItem value="admin">Adm</SelectItem>
                          <SelectItem value="ventas">Ventas</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
