import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { Scissors, Lock, Mail, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ email: "", password: "" });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast({ title: "¡Bienvenida de nuevo! 🌸", description: "Accediendo al sistema..." });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Acceso Denegado", description: "Email o contraseña incorrectos.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: form.email, password: form.password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Scissors className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Beauty Center</h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Acceso para personal</p>
          </div>
        </div>

        {/* Card */}
        <Card className="border border-border bg-card shadow-2xl rounded-2xl overflow-hidden">
          <div className="h-0.5 bg-primary-gradient" />
          <CardHeader className="text-center pt-7 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Lock className="h-3.5 w-3.5 text-primary" /> Iniciar Sesión
            </CardTitle>
          </CardHeader>
          <CardContent className="p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest ml-1">Email Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="tu@beautycenter.com"
                    className="pl-10 h-12 rounded-xl border-border bg-muted/30 focus:border-primary text-foreground font-medium placeholder:text-muted-foreground transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest ml-1">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10 h-12 rounded-xl border-border bg-muted/30 focus:border-primary text-foreground font-medium placeholder:text-muted-foreground transition-all"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all group mt-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "VALIDANDO..." : (
                  <span className="flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                    ENTRAR <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary/40" />
                Solo personal autorizado · Rose Gold Edition
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
