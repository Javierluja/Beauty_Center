import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  CalendarDays,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Bell,
  Package,
  CreditCard,
  Wallet,
  ArrowRight,
  Smartphone,
  Gift,
  Banknote,
} from "lucide-react";
import { useNavigate } from "react-router";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
  onClick,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  loading: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`
        border border-border bg-card
        transition-all duration-200
        ${onClick ? "cursor-pointer hover:border-primary/40 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_4px_20px_hsl(var(--primary)/0.08)]" : ""}
      `}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {title}
        </CardTitle>
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {loading ? (
          <Skeleton className="h-8 w-24 bg-muted" />
        ) : (
          <div className="text-2xl font-black text-foreground tracking-tight">{value}</div>
        )}
        <p className="text-[10px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wider">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: todayAppointments, isLoading: loadingAppts } =
    trpc.appointment.todayCount.useQuery();
  const { data: clientsList, isLoading: loadingClients } =
    trpc.customers.list.useQuery();
  const { data: upcomingAppts, isLoading: loadingUpcoming } =
    trpc.appointment.upcoming.useQuery(7);
  const { data: lowStockProducts, isLoading: loadingStock } =
    trpc.product.list.useQuery({ lowStock: true });
  const { data: dailySummary } = trpc.sale.dailySummary.useQuery();
  const { data: paymentDetail } = trpc.sale.paymentMethodsDetail.useQuery();

  const totalClients = clientsList?.length ?? 0;
  const todayCount = todayAppointments ?? 0;

  const formatCurrency = (val: any) => {
    const num = Math.floor(Number(val)) || 0;
    return `$${num.toLocaleString('es-CL')}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-1 pb-2">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Panel de Control</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenida, <span className="text-primary font-semibold">{user?.name || "Administradora"}</span>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Citas Hoy"  value={todayCount}                         icon={CalendarDays}  description="En agenda"      loading={loadingAppts}    onClick={() => navigate("/agenda")} />
        <StatCard title="Ingresos"   value={formatCurrency(dailySummary?.income)} icon={ShoppingCart}  description="Ventas brutas"  loading={!dailySummary}   onClick={() => navigate("/ventas")} />
        <StatCard title="Gastos"     value={formatCurrency(dailySummary?.expense)} icon={DollarSign}    description="Egresos hoy"    loading={!dailySummary}   onClick={() => navigate("/gastos")} />
        <StatCard title="Neto"       value={formatCurrency(dailySummary?.net)}     icon={TrendingUp}    description="Ganancia real"  loading={!dailySummary} />
        <StatCard title="Clientes"   value={totalClients}                          icon={Users}         description="Base de datos"  loading={loadingClients}  onClick={() => navigate("/clientes")} />
      </div>

      {/* Fila 2 */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Detalle de pagos */}
        <Card className="lg:col-span-2 border border-border bg-card overflow-hidden">
          <CardHeader className="border-b border-border px-6 py-4">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Detalle de Pagos (Hoy)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-5">
            {!paymentDetail ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl bg-muted" />)}
              </div>
            ) : paymentDetail.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground italic">
                Sin ventas registradas hoy
              </div>
            ) : (
              <div className="space-y-5">
                {paymentDetail.map((item) => {
                  const max = Math.max(...paymentDetail.map(p => Number(p.amount) || 1));
                  const percentage = (Number(item.amount) / max) * 100;

                  let label = item.method ? item.method.replace('_', ' ') : "Desconocido";
                  let Icon = DollarSign;

                  if (item.method === 'contado' || item.method === 'cash')     { label = 'Contado';      Icon = Banknote;  }
                  else if (item.method === 'transferencia')                    { label = 'Transferencia'; Icon = Smartphone; }
                  else if (item.method === 'credito')                          { label = 'Crédito';      Icon = CreditCard; }
                  else if (item.method === 'transbank' || item.method === 'card') { label = 'Transbank'; Icon = CreditCard; }
                  else if (item.method === 'gift_card')                        { label = 'Gift Card';    Icon = Gift;       }

                  return (
                    <div key={item.method} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-foreground uppercase flex items-center gap-2 tracking-wider">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          {label}
                        </span>
                        <span className="text-sm font-black text-primary">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas / Stock bajo */}
        <Card className="border border-border bg-card overflow-hidden">
          <CardHeader className="border-b border-border px-5 py-4">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Bell className="h-4 w-4 text-destructive" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 py-4">
            {loadingStock ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-full rounded-lg bg-muted" />)}
              </div>
            ) : lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 6).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2.5 bg-destructive/5 rounded-lg border border-destructive/15">
                    <span className="text-[11px] font-semibold text-foreground truncate max-w-[130px] uppercase tracking-tight">{product.name}</span>
                    <Badge variant="destructive" className="h-5 px-2 text-[9px] font-bold">{product.stock} uni</Badge>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[10px] font-bold text-destructive/80 hover:text-destructive hover:bg-destructive/5 mt-1"
                  onClick={() => navigate("/productos")}
                >
                  VER TODO <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-10">
                <Package className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Inventario al día</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fila 3 */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Próximas citas */}
        <Card className="border border-border bg-card overflow-hidden">
          <CardHeader className="border-b border-border px-6 py-4">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Próximos 7 días
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[280px] overflow-y-auto no-scrollbar">
            {loadingUpcoming ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl bg-muted" />)}
              </div>
            ) : upcomingAppts && upcomingAppts.length > 0 ? (
              <div className="divide-y divide-border">
                {upcomingAppts.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent transition-all group">
                    <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex flex-col items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <span className="text-[9px] font-bold uppercase leading-none mb-0.5">
                        {(() => {
                          const dateStr = typeof appt.appointmentDate === 'string' ? appt.appointmentDate : new Date(appt.appointmentDate).toISOString().split('T')[0];
                          return new Date(dateStr + "T12:00:00").toLocaleDateString('es-ES', { weekday: 'short' });
                        })()}
                      </span>
                      <span className="text-base font-black leading-none">
                        {(() => {
                          const dateStr = typeof appt.appointmentDate === 'string' ? appt.appointmentDate : new Date(appt.appointmentDate).toISOString().split('T')[0];
                          return new Date(dateStr + "T12:00:00").getDate();
                        })()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-foreground uppercase truncate tracking-tight">{appt.clientName || "Cliente"}</p>
                      <p className="text-[10px] text-primary/80 font-medium truncate mt-0.5">{appt.serviceName}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground bg-accent px-2.5 py-1 rounded-lg border border-border">
                        {appt.appointmentTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground/30">
                <CalendarDays className="h-8 w-8" />
                <p className="text-[10px] font-medium uppercase tracking-widest">Sin citas próximas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cumpleaños de Hoy */}
        <Card className="border border-border bg-card overflow-hidden">
          <CardHeader className="border-b border-border px-6 py-4">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 text-pink-500">
              <Gift className="h-4 w-4" />
              Cumpleaños (Próximos 7 días)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-[280px] overflow-y-auto no-scrollbar">
            {loadingClients ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl bg-muted" />)}
              </div>
            ) : clientsList && clientsList.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const today = new Date();
                  const upcomingBirthdays = clientsList.filter((client: any) => {
                    if (!client.birthDate) return false;
                    const [y, m, d] = client.birthDate.split('-').map(Number);
                    const bDay = new Date(today.getFullYear(), m - 1, d);
                    // Si ya pasó este año, vemos si faltan menos de 7 días para el próximo
                    if (bDay.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) {
                      bDay.setFullYear(today.getFullYear() + 1);
                    }
                    const diffTime = Math.abs(bDay.getTime() - today.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7;
                  }).sort((a: any, b: any) => {
                    const [ya, ma, da] = a.birthDate.split('-').map(Number);
                    const [yb, mb, db] = b.birthDate.split('-').map(Number);
                    let bDayA = new Date(today.getFullYear(), ma - 1, da);
                    let bDayB = new Date(today.getFullYear(), mb - 1, db);
                    if (bDayA.getTime() < today.getTime()) bDayA.setFullYear(today.getFullYear() + 1);
                    if (bDayB.getTime() < today.getTime()) bDayB.setFullYear(today.getFullYear() + 1);
                    return bDayA.getTime() - bDayB.getTime();
                  });

                  if (upcomingBirthdays.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground/30">
                        <Gift className="h-8 w-8" />
                        <p className="text-[10px] font-medium uppercase tracking-widest">Sin cumpleaños cercanos</p>
                      </div>
                    );
                  }

                  return upcomingBirthdays.map((client: any) => {
                    const [y, m, d] = client.birthDate.split('-').map(Number);
                    const isToday = m === today.getMonth() + 1 && d === today.getDate();
                    
                    return (
                      <div key={client.id} className="flex items-center gap-4 px-4 py-3 bg-accent/50 rounded-xl border border-border">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isToday ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" : "bg-pink-500/10 text-pink-500"}`}>
                          <span className="text-xl leading-none">🎂</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-foreground uppercase truncate tracking-tight">{client.name}</p>
                          <p className="text-[10px] text-pink-500 font-black uppercase tracking-widest mt-0.5">
                            {isToday ? "¡HOY!" : `${d} de ${new Date(2000, m - 1).toLocaleDateString('es-ES', { month: 'long' })}`}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg shrink-0"
                          onClick={() => {
                            const msg = `¡Hola ${client.name.split(' ')[0]}! 🌸 Te enviamos un gran saludo de cumpleaños de parte de todo el equipo de BeautyLife Center. ¡Que tengas un hermoso día! ✨`;
                            window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Agendar",  icon: CalendarDays, path: "/agenda"    },
            { label: "Cobrar",   icon: ShoppingCart, path: "/ventas"    },
            { label: "Clientes", icon: Users,        path: "/clientes"  },
            { label: "Stock",    icon: Package,      path: "/productos" },
          ].map((btn) => (
            <button
              key={btn.path}
              onClick={() => navigate(btn.path)}
              className="
                flex flex-col items-center justify-center gap-3 p-6
                bg-card border border-border rounded-2xl
                hover:border-primary/40 hover:bg-accent
                transition-all duration-200 group
                hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_4px_16px_hsl(var(--primary)/0.06)]
              "
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                <btn.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
