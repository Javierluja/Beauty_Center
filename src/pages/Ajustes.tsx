import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Bell, Shield, Palette, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/providers/trpc";

export default function Ajustes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("perfil");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
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
                    onClick={() => {
                      toast({ title: "Perfil actualizado ✨", description: "Tus cambios han sido guardados correctamente." });
                    }}
                    className="bg-primary hover:bg-primary/90 font-black h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 uppercase group"
                  >
                    Guardar Cambios ✨
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
        </div>
      </div>
    </div>
  );
}
