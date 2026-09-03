import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Bell, Shield, Palette, Sparkles, CloudDownload, FileSpreadsheet, Database } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/providers/trpc";

export default function Ajustes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("perfil");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      utils.user.list.invalidate();
      toast({ 
        title: "¡Perfil actualizado! ✨", 
        description: "Tu información ha sido guardada correctamente." 
      });
    },
    onError: (err) => {
      toast({ 
        title: "Error al actualizar", 
        description: err.message, 
        variant: "destructive" 
      });
    },
  });
  
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  
  const changePwd = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      toast({ title: "Contraseña actualizada 🔒", description: "Tu seguridad ha sido reforzada." });
      setPasswords({ currentPassword: "", newPassword: "" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
  
  // Estados para interruptores
  const [opts, setOpts] = useState({
    darkMode: localStorage.getItem('theme') !== 'light',
    animations: true,
    whatsapp: true,
    report: false
  });

  const toggleTheme = () => {
    const newDarkMode = !opts.darkMode;
    setOpts({ ...opts, darkMode: newDarkMode });
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Configuración</h1>
        <p className="text-xs text-muted-foreground mt-1">Personaliza tu experiencia en BeautyLife Center</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* MENÚ DE AJUSTES */}
        <div className="lg:col-span-1 space-y-3">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("perfil")}
            className={`w-full justify-start gap-3 h-12 rounded-xl font-semibold text-sm border transition-all ${activeTab === "perfil" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border text-foreground hover:border-primary/40 hover:bg-accent"}`}
          >
            <User className="h-5 w-5" /> Mi Perfil
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("apariencia")}
            className={`w-full justify-start gap-3 h-12 rounded-xl font-semibold text-sm border transition-all ${activeTab === "apariencia" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border text-foreground hover:border-primary/40 hover:bg-accent"}`}
          >
            <Palette className="h-5 w-5" /> Apariencia
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("notificaciones")}
            className={`w-full justify-start gap-3 h-12 rounded-xl font-semibold text-sm border transition-all ${activeTab === "notificaciones" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border text-foreground hover:border-primary/40 hover:bg-accent"}`}
          >
            <Bell className="h-5 w-5" /> Notificaciones
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("seguridad")}
            className={`w-full justify-start gap-3 h-12 rounded-xl font-semibold text-sm border transition-all ${activeTab === "seguridad" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border text-foreground hover:border-primary/40 hover:bg-accent"}`}
          >
            <Shield className="h-5 w-5" /> Seguridad
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("backup")}
            className={`w-full justify-start gap-3 h-12 rounded-xl font-semibold text-sm border transition-all ${activeTab === "backup" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border text-foreground hover:border-primary/40 hover:bg-accent"}`}
          >
            <CloudDownload className="h-5 w-5" /> Copias de Seguridad
          </Button>
        </div>

        {/* CONTENIDO DE AJUSTES */}
        <div className="lg:col-span-2">
          {activeTab === "perfil" && (
            <Card className="border border-border shadow-xl rounded-2xl overflow-hidden bg-card">
              <CardHeader className="border-b border-border px-6 py-5">
                <CardTitle className="font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Información del Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase text-foreground ml-1 tracking-widest">Nombre de Usuario</Label>
                    <Input 
                      value={form.name} 
                      onChange={(e) => setForm({...form, name: e.target.value})} 
                      className="rounded-xl border-border h-12 bg-muted/30 text-foreground focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase text-foreground ml-1 tracking-widest">Email</Label>
                    <Input 
                      value={form.email} 
                      disabled 
                      className="rounded-xl border-border h-12 bg-muted opacity-50 text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-primary/5">
                  <Button 
                    disabled={updateProfile.isPending || !form.name.trim()}
                    onClick={() => {
                      updateProfile.mutate({ name: form.name.trim() });
                    }}
                    className="bg-primary hover:bg-primary/90 font-black h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 uppercase group"
                  >
                    {updateProfile.isPending ? "Guardando..." : "Guardar Cambios ✨"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "apariencia" && (
            <Card className="border border-border shadow-2xl rounded-[2.5rem] overflow-hidden bg-card animate-in fade-in slide-in-from-right-4 duration-300">
              <CardHeader className="bg-muted/30 border-b border-border p-8">
                <CardTitle className="font-black text-foreground uppercase flex items-center gap-2 tracking-tight">
                  <Palette className="h-6 w-6 text-primary" /> Apariencia Visual
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/20 hover:border-primary/20 transition-all">
                    <div>
                      <p className="font-black uppercase text-foreground text-sm tracking-tight">Modo Oscuro</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.15em] mt-1 italic">Activar tema oscuro para la aplicación</p>
                    </div>
                    <div 
                      onClick={toggleTheme}
                      className={`h-7 w-14 rounded-full cursor-pointer relative transition-colors duration-300 shadow-inner ${opts.darkMode ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <div className={`h-5 w-5 bg-background rounded-full absolute top-1 shadow-md transition-transform duration-300 ${opts.darkMode ? 'translate-x-8' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-5 border border-border rounded-3xl bg-muted/20 hover:border-primary/20 transition-all">
                    <div>
                      <p className="font-black uppercase text-foreground text-sm tracking-tight">Animaciones UI</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.15em] mt-1 italic">Habilitar transiciones fluidas</p>
                    </div>
                    <div 
                      onClick={() => setOpts({ ...opts, animations: !opts.animations })}
                      className={`h-6 w-12 rounded-full cursor-pointer relative transition-colors duration-300 ${opts.animations ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <div className={`h-4 w-4 bg-background rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${opts.animations ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-primary/5">
                  <Button onClick={() => toast({ title: "Apariencia guardada ✨", description: "Tus preferencias visuales han sido actualizadas." })} className="bg-primary hover:bg-primary/90 font-black h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 uppercase group">
                    Guardar Apariencia
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notificaciones" && (
            <Card className="border border-border shadow-2xl rounded-[2.5rem] overflow-hidden bg-card animate-in fade-in slide-in-from-right-4 duration-300">
              <CardHeader className="bg-muted/30 border-b border-border p-8">
                <CardTitle className="font-black text-foreground uppercase flex items-center gap-2 tracking-tight">
                  <Bell className="h-6 w-6 text-primary" /> Configuración de Alertas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/20 hover:border-primary/20 transition-all">
                    <div>
                      <p className="font-semibold text-foreground text-sm">Avisos por WhatsApp</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Generar enlaces para enviar recordatorios</p>
                    </div>
                    <div 
                      onClick={() => setOpts({ ...opts, whatsapp: !opts.whatsapp })}
                      className={`h-6 w-12 rounded-full cursor-pointer relative transition-colors duration-300 ${opts.whatsapp ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <div className={`h-4 w-4 bg-background rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${opts.whatsapp ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </div>
                  </div>

                </div>
                <div className="pt-6 border-t border-primary/5">
                  <Button onClick={() => toast({ title: "Alertas actualizadas ✨", description: "Configuración de notificaciones guardada." })} className="bg-primary hover:bg-primary/90 font-black h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 uppercase group">
                    Guardar Alertas
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "seguridad" && (
            <Card className="border border-border shadow-2xl rounded-[2.5rem] overflow-hidden bg-card animate-in fade-in slide-in-from-right-4 duration-300">
              <CardHeader className="bg-muted/30 border-b border-border p-8">
                <CardTitle className="font-black text-foreground uppercase flex items-center gap-2 tracking-tight">
                  <Shield className="h-6 w-6 text-primary" /> Privacidad y Accesos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase text-foreground ml-1 tracking-widest">Contraseña Actual</Label>
                    <Input type="password" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} placeholder="••••••••" className="rounded-xl border border-border h-14 font-black text-foreground bg-muted/20 focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase text-foreground ml-1 tracking-widest">Nueva Contraseña</Label>
                    <Input type="password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} placeholder="••••••••" className="rounded-xl border border-border h-14 font-black text-foreground bg-muted/20 focus:border-primary transition-all" />
                  </div>
                </div>
                <div className="pt-6 border-t border-primary/5 flex items-center justify-between">
                  <Button disabled={changePwd.isPending || !passwords.currentPassword || !passwords.newPassword} onClick={() => changePwd.mutate(passwords)} className="bg-primary hover:bg-primary/90 font-black h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 uppercase group">
                    {changePwd.isPending ? "Actualizando..." : "Actualizar Contraseña"}
                  </Button>
                  <Button variant="ghost" className="text-destructive font-black text-xs uppercase hover:bg-destructive/10">Cerrar Sesión en otros dispositivos</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "backup" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Card className="border border-border shadow-xl rounded-2xl overflow-hidden bg-card">
                <CardHeader className="border-b border-border px-6 py-5">
                  <CardTitle className="font-bold text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-500" /> Sincronización con Google Sheets
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    El sistema envía copias de seguridad continuas de cada nuevo cliente, cita agendada, sesión canjeada, venta y gasto directamente a tu planilla de Google Sheets.
                  </p>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Sincronización Automática Activa</p>
                      <p className="text-[11px] text-muted-foreground">Todos los cambios en clientes, citas, ventas y sesiones se respaldan en tiempo real.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border shadow-xl rounded-2xl overflow-hidden bg-card">
                <CardHeader className="border-b border-border px-6 py-5">
                  <CardTitle className="font-bold text-foreground flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" /> Descargar Copia Local de Seguridad
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Genera y descarga un archivo completo con todos los registros actuales de tu negocio (clientes, servicios, citas, ventas, sesiones y gastos) en tu computadora.
                  </p>
                  <Button 
                    onClick={async () => {
                      try {
                        toast({ title: "Generando respaldo...", description: "Extrayendo información de la base de datos." });
                        const res = await fetch("/api/trpc/backup.exportAll");
                        const json = await res.json();
                        const data = json?.result?.data?.json || json?.result?.data || json;
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `BeautyCenter_Backup_${new Date().toISOString().split("T")[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: "¡Copia descargada! 💾", description: "Tu respaldo se guardó en tu carpeta de Descargas." });
                      } catch (err: any) {
                        toast({ title: "Error al descargar", description: err.message, variant: "destructive" });
                      }
                    }}
                    className="bg-primary hover:bg-primary/90 font-bold h-12 px-6 rounded-xl shadow-lg uppercase flex items-center gap-2"
                  >
                    <CloudDownload className="h-5 w-5" /> Descargar Respaldo Completo (.JSON)
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
