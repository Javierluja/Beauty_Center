import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOGIN_PATH } from "@/const";
import {
  LayoutDashboard,
  LogOut,
  Users,
  Scissors,
  Package,
  CalendarDays,
  ShoppingCart,
  ShoppingBag,
  Bell,
  Receipt,
  Sparkles,
  Menu,
  X,
  Wallet,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { useState, type ReactNode, useEffect } from "react";
import { useLocation, useNavigate, Link, Navigate } from "react-router";
import { AuthLayoutSkeleton } from "./AuthLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard",  path: "/", permKey: "dashboard" },
  { icon: CalendarDays,    label: "Agenda",     path: "/agenda", permKey: "agenda" },
  { icon: Bell,           label: "Avisos",      path: "/notificaciones", permKey: "avisos" },
  { icon: ShoppingCart,   label: "Ventas",      path: "/ventas", permKey: "ventas" },
  { icon: ShoppingBag,    label: "Compras",     path: "/compras", permKey: "compras" },
  { icon: Sparkles,       label: "Sesiones",    path: "/sesiones", permKey: "sesiones" },
  { icon: Package,        label: "Productos",   path: "/productos", permKey: "productos" },
  { icon: Scissors,       label: "Servicios",   path: "/servicios", permKey: "servicios" },
  { icon: Wallet,         label: "Cuentas",     path: "/cuentas", permKey: "cuentas" },
  { icon: Users,          label: "Clientes",    path: "/clientes", permKey: "clientes" },
  { icon: Receipt,        label: "Gastos",      path: "/gastos", permKey: "gastos" },
  { icon: ShieldCheck,    label: "Personal",    path: "/personal", permKey: "personal" },
  { icon: Settings,       label: "Ajustes",     path: "/ajustes", permKey: "ajustes" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { isLoading, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (isLoading) return <AuthLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full bg-card rounded-3xl shadow-xl border border-primary/20">
          <h1 className="text-3xl font-black text-primary tracking-tighter uppercase">Beauty Center</h1>
          <Button onClick={() => window.location.href = LOGIN_PATH} size="lg" className="w-full bg-primary font-black">
            INICIAR SESIÓN
          </Button>
        </div>
      </div>
    );
  }

  let userPerms: Record<string, boolean> = {};
  try {
    if (user.permissions) {
      userPerms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
    }
  } catch (e) {}

  const filteredMenu = menuItems.filter(item => {
    if (user.role === 'admin_pro') return true;
    // Si no es admin_pro, verificamos sus permisos (por defecto true excepto si explícitamente es false)
    if (item.permKey === 'personal') return false; // Personal siempre bloqueado para no-admins por seguridad extra
    if (userPerms[item.permKey] === false) return false;
    return true;
  });

  if (location.pathname === '/personal' && user.role !== 'admin_pro') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">

      {/* ── SIDEBAR ────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-card border-r border-border shadow-2xl
        transition-transform duration-300
        lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>

        {/* Logo */}
        <div className="px-6 py-7 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-lg shadow-primary/25">
              <Scissors className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-black text-base text-foreground tracking-tight block leading-none">Beauty</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Center</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4">
          <nav className="space-y-1">
            {filteredMenu.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    text-[11px] font-bold tracking-widest uppercase
                    transition-all duration-200
                    ${isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-primary"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile */}
        <div className="px-3 pb-4 pt-2 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="
                flex items-center gap-3 w-full p-3 rounded-xl
                bg-accent hover:bg-accent/80
                border border-border hover:border-primary/30
                transition-all duration-200 group
              ">
                <Avatar className="h-9 w-9 border-2 border-primary/40 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground font-black text-sm">
                    {(user.name || user.email || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left overflow-hidden flex-1 min-w-0">
                  <p className="text-[11px] font-black truncate text-foreground uppercase tracking-tight">
                    {user.name}
                  </p>
                  <p className="text-[9px] text-primary truncate uppercase font-bold tracking-widest mt-0.5">
                    {user.role?.replace('_', ' ')}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-card border-border shadow-2xl">
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive font-black text-xs cursor-pointer rounded-xl hover:bg-destructive/10 uppercase p-3"
              >
                <LogOut className="mr-2 h-4 w-4" />
                CERRAR SESIÓN
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Overlay móvil */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── CONTENIDO PRINCIPAL ──────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">

        {/* Header móvil */}
        <header className="lg:hidden h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary-gradient flex items-center justify-center">
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-sm text-foreground uppercase tracking-tight">Beauty Center</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)} className="text-muted-foreground hover:text-primary">
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto pb-20 lg:pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
