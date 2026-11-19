import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
  Trash2,
  TrendingUp,
  Receipt,
  CheckCircle2,
  CalendarRange,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function getStartOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff, 0, 0, 0, 0);
}

function getEndOfWeek(startOfWeek: Date): Date {
  return new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6, 23, 59, 59, 999);
}

function getMonthBounds(year: number, monthIndex: number): { start: Date; end: Date } {
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getDaysList(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const stop = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (curr <= stop) {
    days.push(new Date(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return days;
}

function formatCLP(val: number): string {
  return `$${Math.round(val || 0).toLocaleString("es-CL")}`;
}

function normalizePaymentMethod(pm?: string): "transbank" | "contado" | "transferencia" | "credito" | "cortesia" | "merma" | "otro" {
  const m = (pm || "").toLowerCase().trim();
  if (m.includes("transbank") || m.includes("tarjeta") || m.includes("pos") || m.includes("debito") || m.includes("tbk")) {
    return "transbank";
  }
  if (m.includes("contado") || m.includes("efectivo")) {
    return "contado";
  }
  if (m.includes("transfer") || m.includes("deposito")) {
    return "transferencia";
  }
  if (m.includes("cortesia") || m.includes("cortesía") || m.includes("gratis")) {
    return "cortesia";
  }
  if (m.includes("merma") || m.includes("perdida") || m.includes("pérdida")) {
    return "merma";
  }
  if (m.includes("credito") || m.includes("crédito")) {
    return "credito";
  }
  return "otro";
}

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CierreCaja() {
  const { toast } = useToast();

  // Fecha local inicial
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toLocalDateString(now), [now]);

  // Modo: semanal | mensual
  const [mode, setMode] = useState<"semanal" | "mensual">("semanal");

  // Estado para modo semanal
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(() => new Date());

  // Estado para modo mensual
  const [selectedMonth, setSelectedMonth] = useState<number>(() => now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(() => now.getFullYear());

  // Día seleccionado para ver el detalle de ventas (inicializado con hoy)
  const [selectedDayStr, setSelectedDayStr] = useState<string>(todayStr);

  // Calcular rango de fechas según el modo
  const { dateFrom, dateTo, periodLabel } = useMemo(() => {
    if (mode === "semanal") {
      const start = getStartOfWeek(selectedWeekDate);
      const end = getEndOfWeek(start);
      const fStart = start.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
      const fEnd = end.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
      return {
        dateFrom: start,
        dateTo: end,
        periodLabel: `Semana del ${fStart} al ${fEnd}`,
      };
    } else {
      const { start, end } = getMonthBounds(selectedYear, selectedMonth);
      const monthName = MONTH_NAMES[selectedMonth];
      return {
        dateFrom: start,
        dateTo: end,
        periodLabel: `${monthName} ${selectedYear}`,
      };
    }
  }, [mode, selectedWeekDate, selectedMonth, selectedYear]);

  // Consulta al backend para obtener ventas e ítems del período
  const { data: cierreData, isLoading, refetch } = trpc.sale.cierreCaja.useQuery(
    { dateFrom, dateTo },
    { refetchOnWindowFocus: false }
  );

  const sales = cierreData?.sales || [];
  const items = cierreData?.items || [];

  // Mapear ventas agrupadas por fecha local (YYYY-MM-DD)
  const salesByDate = useMemo(() => {
    const map = new Map<string, typeof sales>();
    for (const s of sales) {
      const d = new Date(s.createdAt);
      const dStr = toLocalDateString(d);
      const arr = map.get(dStr) || [];
      arr.push(s);
      map.set(dStr, arr);
    }
    return map;
  }, [sales]);

  // Generar lista de días del período
  const daysList = useMemo(() => {
    return getDaysList(dateFrom, dateTo);
  }, [dateFrom, dateTo]);

  // Calcular filas del arqueo día por día
  const dailyRows = useMemo(() => {
    return daysList.map((day) => {
      const dStr = toLocalDateString(day);
      const daySales = salesByDate.get(dStr) || [];

      let transferencia = 0;
      let contado = 0;
      let transbank = 0;
      let credito = 0;
      let cortesia = 0;
      let merma = 0;
      let otros = 0;

      for (const s of daySales) {
        const amt = Number(s.finalTotal || 0);
        const norm = normalizePaymentMethod(s.paymentMethod);
        switch (norm) {
          case "transferencia":
            transferencia += amt;
            break;
          case "contado":
            contado += amt;
            break;
          case "transbank":
            transbank += amt;
            break;
          case "credito":
            credito += amt;
            break;
          case "cortesia":
            cortesia += amt;
            break;
          case "merma":
            merma += amt;
            break;
          default:
            otros += amt;
            break;
        }
      }

      const totalDia = transferencia + contado + transbank + credito + cortesia + merma + otros;
      // Recaudación Real: Transbank + Contado + Transferencia (excluye cortesías, mermas y créditos no pagados)
      const recaudacionReal = transbank + contado + transferencia;

      const dayName = day.toLocaleDateString("es-CL", { weekday: "long" });
      const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      const formattedDate = day.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
      const isToday = dStr === todayStr;

      return {
        dateObj: day,
        dateStr: dStr,
        dayName: capitalizedDayName,
        formattedDate,
        salesCount: daySales.length,
        transferencia,
        contado,
        transbank,
        credito,
        cortesia,
        merma,
        totalDia,
        recaudacionReal,
        isToday,
      };
    });
  }, [daysList, salesByDate, todayStr]);

  // Totales acumulados del período (KPIs y pie de tabla)
  const totals = useMemo(() => {
    let salesCount = 0;
    let transferencia = 0;
    let contado = 0;
    let transbank = 0;
    let credito = 0;
    let cortesia = 0;
    let merma = 0;
    let totalPeriodo = 0;
    let recaudacionReal = 0;

    for (const r of dailyRows) {
      salesCount += r.salesCount;
      transferencia += r.transferencia;
      contado += r.contado;
      transbank += r.transbank;
      credito += r.credito;
      cortesia += r.cortesia;
      merma += r.merma;
      totalPeriodo += r.totalDia;
      recaudacionReal += r.recaudacionReal;
    }

    return {
      salesCount,
      transferencia,
      contado,
      transbank,
      credito,
      cortesia,
      merma,
      totalPeriodo,
      recaudacionReal,
    };
  }, [dailyRows]);

  // Detalle de ventas para el día seleccionado
  const selectedDayDetail = useMemo(() => {
    const daySales = salesByDate.get(selectedDayStr) || [];
    const itemsMap = new Map<number, typeof items>();
    for (const it of items) {
      const arr = itemsMap.get(it.saleId) || [];
      arr.push(it);
      itemsMap.set(it.saleId, arr);
    }

    const detailList: Array<{
      saleId: number;
      comanda: string;
      categoria: string;
      itemNombre: string;
      cantidad: string;
      precioUnitario: number;
      total: number;
      medioPago: string;
      observaciones: string;
      cliente: string;
    }> = [];

    for (const sale of daySales) {
      const saleSpecificItems = itemsMap.get(sale.id) || [];
      if (saleSpecificItems.length > 0) {
        for (const it of saleSpecificItems) {
          detailList.push({
            saleId: sale.id,
            comanda: `#V-${sale.id}`,
            categoria: it.category || (it.type === "product" ? "Producto" : "Servicio"),
            itemNombre: it.name,
            cantidad: String(it.quantity),
            precioUnitario: Number(it.unitPrice || 0),
            total: Number(it.totalPrice || 0),
            medioPago: sale.paymentMethod,
            observaciones: sale.notes || "-",
            cliente: sale.clientName || "Cliente General",
          });
        }
      } else {
        // En caso de ventas antiguas o globales sin ítems desglosados
        detailList.push({
          saleId: sale.id,
          comanda: `#V-${sale.id}`,
          categoria: "Venta General",
          itemNombre: `Venta #${sale.id}`,
          cantidad: "1",
          precioUnitario: Number(sale.finalTotal || 0),
          total: Number(sale.finalTotal || 0),
          medioPago: sale.paymentMethod,
          observaciones: sale.notes || "-",
          cliente: sale.clientName || "Cliente General",
        });
      }
    }

    return detailList;
  }, [selectedDayStr, salesByDate, items]);

  // Navegación de períodos
  function handlePrev() {
    if (mode === "semanal") {
      setSelectedWeekDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() - 7);
        return d;
      });
    } else {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear((y) => y - 1);
      } else {
        setSelectedMonth((m) => m - 1);
      }
    }
  }

  function handleNext() {
    if (mode === "semanal") {
      setSelectedWeekDate((prev) => {
        const d = new Date(prev);
        d.setDate(d.getDate() + 7);
        return d;
      });
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear((y) => y + 1);
      } else {
        setSelectedMonth((m) => m + 1);
      }
    }
  }

  function handleCurrent() {
    const today = new Date();
    setSelectedWeekDate(today);
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
    setSelectedDayStr(todayStr);
  }

  // Exportación a Excel (.xlsx) con 2 hojas
  function handleExportExcel() {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Hoja "Resumen_Cierre"
      const resumenHeaders = [
        "Día",
        "Fecha",
        "Cant. Ventas",
        "Transferencia",
        "Contado",
        "Transbank",
        "Crédito",
        "Cortesía",
        "Merma",
        "Total Día",
        "Recaudación Real",
      ];

      const resumenRows = dailyRows.map((r) => [
        r.dayName,
        r.formattedDate,
        r.salesCount,
        r.transferencia,
        r.contado,
        r.transbank,
        r.credito,
        r.cortesia,
        r.merma,
        r.totalDia,
        r.recaudacionReal,
      ]);

      const resumenFooter = [
        "TOTAL DEL PERÍODO",
        periodLabel,
        totals.salesCount,
        totals.transferencia,
        totals.contado,
        totals.transbank,
        totals.credito,
        totals.cortesia,
        totals.merma,
        totals.totalPeriodo,
        totals.recaudacionReal,
      ];

      const wsResumen = XLSX.utils.aoa_to_sheet([
        [`CIERRE DE CAJA - ${periodLabel.toUpperCase()}`],
        [],
        resumenHeaders,
        ...resumenRows,
        resumenFooter,
      ]);

      // Anchos de columna para Resumen_Cierre
      wsResumen["!cols"] = [
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
      ];

      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen_Cierre");

      // 2. Hoja "Detalle_Ventas"
      const detalleHeaders = [
        "Fecha",
        "Comanda/Código",
        "Cliente",
        "Categoría",
        "Producto/Servicio",
        "Cantidad/Peso",
        "Precio Unitario",
        "Total",
        "Medio de Pago",
        "Observaciones",
      ];

      // Mapear todas las transacciones individuales del período
      const itemsMap = new Map<number, typeof items>();
      for (const it of items) {
        const arr = itemsMap.get(it.saleId) || [];
        arr.push(it);
        itemsMap.set(it.saleId, arr);
      }

      const allDetailsRows: any[] = [];
      for (const s of sales) {
        const d = new Date(s.createdAt);
        const fDate = d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
        const sItems = itemsMap.get(s.id) || [];

        if (sItems.length > 0) {
          for (const it of sItems) {
            allDetailsRows.push([
              fDate,
              `#V-${s.id}`,
              s.clientName || "Cliente General",
              it.category || (it.type === "product" ? "Producto" : "Servicio"),
              it.name,
              it.quantity,
              Number(it.unitPrice || 0),
              Number(it.totalPrice || 0),
              s.paymentMethod,
              s.notes || "-",
            ]);
          }
        } else {
          allDetailsRows.push([
            fDate,
            `#V-${s.id}`,
            s.clientName || "Cliente General",
            "Venta General",
            `Venta #${s.id}`,
            1,
            Number(s.finalTotal || 0),
            Number(s.finalTotal || 0),
            s.paymentMethod,
            s.notes || "-",
          ]);
        }
      }

      const wsDetalle = XLSX.utils.aoa_to_sheet([
        [`DETALLE DE VENTAS - ${periodLabel.toUpperCase()}`],
        [],
        detalleHeaders,
        ...allDetailsRows,
      ]);

      // Anchos de columna para Detalle_Ventas
      wsDetalle["!cols"] = [
        { wch: 18 },
        { wch: 14 },
        { wch: 22 },
        { wch: 18 },
        { wch: 30 },
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 30 },
      ];

      XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle_Ventas");

      // Descargar archivo
      const sanitizedPeriod = periodLabel.replace(/[\/\s:]+/g, "_");
      const filename = `Cierre_Caja_${sanitizedPeriod}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: "¡Exportación exitosa! 📊",
        description: `Se descargó el archivo ${filename} con las hojas Resumen_Cierre y Detalle_Ventas.`,
      });
    } catch (err: any) {
      console.error("[Excel Export Error]:", err);
      toast({
        title: "Error al exportar Excel",
        description: err.message || "No se pudo generar la planilla Excel.",
        variant: "destructive",
      });
    }
  }

  // Formato para el título del día seleccionado en el detalle
  const selectedDayFormatted = useMemo(() => {
    const parts = selectedDayStr.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayName = d.toLocaleDateString("es-CL", { weekday: "long" });
      const fDate = d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
      return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${fDate}`;
    }
    return selectedDayStr;
  }, [selectedDayStr]);

  return (
    <div className="space-y-6 text-teal-950 dark:text-teal-50">
      {/* ENCABEZADO Y CONTROLES DEL PERÍODO (PALETA TURQUESA) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-teal-900 text-teal-50 p-5 rounded-2xl shadow-md border border-teal-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-teal-800/80 rounded-lg text-teal-300">
              <CalendarRange className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">Cierre de Caja</h1>
            <Badge className="bg-teal-700 hover:bg-teal-700 text-teal-100 font-bold uppercase text-[10px] tracking-wider ml-1">
              {mode === "semanal" ? "Semanal" : "Mensual"}
            </Badge>
          </div>
          <p className="text-xs text-teal-200/90 font-medium">
            Arqueo y recaudación real por medios de pago con exportación a Excel
          </p>
        </div>

        {/* SELECTOR DE MODO Y NAVEGACIÓN */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Semanal / Mensual */}
          <div className="bg-teal-950/60 p-1 rounded-xl flex items-center border border-teal-800">
            <button
              type="button"
              onClick={() => setMode("semanal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                mode === "semanal"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-teal-300 hover:text-white"
              }`}
            >
              Semanal
            </button>
            <button
              type="button"
              onClick={() => setMode("mensual")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                mode === "mensual"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-teal-300 hover:text-white"
              }`}
            >
              Mensual
            </button>
          </div>

          {/* Selectores específicos */}
          {mode === "semanal" ? (
            <div className="flex items-center gap-1.5 bg-teal-950/60 p-1 rounded-xl border border-teal-800">
              <input
                type="date"
                value={toLocalDateString(selectedWeekDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split("-").map(Number);
                    setSelectedWeekDate(new Date(y, m - 1, d));
                  }
                }}
                className="bg-transparent text-white text-xs font-bold px-2 py-1 outline-none rounded cursor-pointer"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-teal-950/60 p-1 rounded-xl border border-teal-800">
              <Select
                value={String(selectedMonth)}
                onValueChange={(val) => setSelectedMonth(Number(val))}
              >
                <SelectTrigger className="h-8 bg-transparent border-0 text-white text-xs font-bold focus:ring-0 w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-teal-900 border-teal-800 text-white">
                  {MONTH_NAMES.map((name, idx) => (
                    <SelectItem
                      key={idx}
                      value={String(idx)}
                      className="text-xs font-semibold hover:bg-teal-800 focus:bg-teal-800"
                    >
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(selectedYear)}
                onValueChange={(val) => setSelectedYear(Number(val))}
              >
                <SelectTrigger className="h-8 bg-transparent border-0 text-white text-xs font-bold focus:ring-0 w-[85px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-teal-900 border-teal-800 text-white">
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <SelectItem
                      key={y}
                      value={String(y)}
                      className="text-xs font-semibold hover:bg-teal-800 focus:bg-teal-800"
                    >
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Flechas de navegación */}
          <div className="flex items-center bg-teal-950/60 rounded-xl border border-teal-800 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="h-8 w-8 text-teal-200 hover:text-white hover:bg-teal-800 rounded-lg"
              title="Período anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCurrent}
              className="h-8 px-2 text-[11px] font-bold uppercase text-teal-200 hover:text-white hover:bg-teal-800 rounded-lg"
            >
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-8 w-8 text-teal-200 hover:text-white hover:bg-teal-800 rounded-lg"
              title="Período siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Botón Descargar Excel */}
          <Button
            onClick={handleExportExcel}
            className="h-9 px-3.5 bg-teal-500 hover:bg-teal-400 text-teal-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
          >
            <Download className="h-4 w-4" />
            Descargar Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* TARJETAS KPI DE RESUMEN DEL PERÍODO */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* TRANSBANK */}
        <Card className="bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 shadow-sm rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-teal-800 dark:text-teal-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Transbank</span>
              <CreditCard className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2">
              <p className="text-lg font-black text-teal-950 dark:text-teal-100">
                {formatCLP(totals.transbank)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CONTADO / EFECTIVO */}
        <Card className="bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 shadow-sm rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-teal-800 dark:text-teal-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Contado / Ef.</span>
              <Banknote className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2">
              <p className="text-lg font-black text-teal-950 dark:text-teal-100">
                {formatCLP(totals.contado)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* TRANSFERENCIA */}
        <Card className="bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 shadow-sm rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-teal-800 dark:text-teal-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Transferencia</span>
              <Smartphone className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2">
              <p className="text-lg font-black text-teal-950 dark:text-teal-100">
                {formatCLP(totals.transferencia)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CRÉDITO */}
        <Card className="bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 shadow-sm rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-teal-800 dark:text-teal-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Crédito</span>
              <Receipt className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2">
              <p className="text-lg font-black text-teal-950 dark:text-teal-100">
                {formatCLP(totals.credito)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CORTESÍA */}
        <Card className="bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 shadow-sm rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-teal-800 dark:text-teal-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Cortesía</span>
              <Sparkles className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2">
              <p className="text-lg font-black text-teal-950 dark:text-teal-100">
                {formatCLP(totals.cortesia)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* MERMA */}
        <Card className="bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 shadow-sm rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-teal-800 dark:text-teal-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Merma</span>
              <Trash2 className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2">
              <p className="text-lg font-black text-teal-950 dark:text-teal-100">
                {formatCLP(totals.merma)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* TARJETA DESTACADA: TOTAL Y RECAUDACIÓN REAL */}
        <Card className="col-span-2 md:col-span-4 lg:col-span-1 bg-gradient-to-br from-teal-800 to-teal-950 text-white border-teal-700 shadow-md rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-teal-200 mb-1">
                <span className="text-[9px] font-black uppercase tracking-wider">Recaudación Real</span>
                <CheckCircle2 className="h-4 w-4 text-teal-300" />
              </div>
              <p className="text-xl font-black text-teal-100 tracking-tight">
                {formatCLP(totals.recaudacionReal)}
              </p>
            </div>
            <div className="mt-2 pt-1.5 border-t border-teal-700/60 flex items-center justify-between text-[10px]">
              <span className="text-teal-300/90 font-semibold">Total Período:</span>
              <span className="font-black text-white">{formatCLP(totals.totalPeriodo)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLA DE ARQUEO DÍA POR DÍA */}
      <Card className="bg-white dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-4 bg-teal-50 dark:bg-teal-900/40 border-b border-teal-200 dark:border-teal-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-700 dark:text-teal-300" />
            <CardTitle className="text-sm font-black text-teal-950 dark:text-teal-100 uppercase tracking-tight">
              Tabla de Arqueo Día por Día ({periodLabel})
            </CardTitle>
          </div>
          <p className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold">
            Haz clic en cualquier día para desglosar su detalle de ventas debajo
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-teal-100/70 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200 font-black uppercase text-[10px] tracking-wider border-b border-teal-200 dark:border-teal-800">
                <tr>
                  <th className="py-2.5 px-3">Día</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-2 text-center">Cant. Ventas</th>
                  <th className="py-2.5 px-3 text-right">Transferencia</th>
                  <th className="py-2.5 px-3 text-right">Contado</th>
                  <th className="py-2.5 px-3 text-right">Transbank</th>
                  <th className="py-2.5 px-3 text-right">Crédito</th>
                  <th className="py-2.5 px-3 text-right">Cortesía</th>
                  <th className="py-2.5 px-3 text-right">Merma</th>
                  <th className="py-2.5 px-3 text-right font-black bg-teal-200/40 dark:bg-teal-900/80">
                    Total Día
                  </th>
                  <th className="py-2.5 px-3 text-right font-black bg-teal-600 text-white">
                    Recaudación Real
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-100 dark:divide-teal-900/50 font-medium">
                {dailyRows.map((row) => {
                  const isSelected = row.dateStr === selectedDayStr;
                  return (
                    <tr
                      key={row.dateStr}
                      onClick={() => setSelectedDayStr(row.dateStr)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-teal-100/90 dark:bg-teal-800/60 font-semibold"
                          : row.isToday
                          ? "bg-teal-50/90 dark:bg-teal-900/30 hover:bg-teal-100/60 dark:hover:bg-teal-900/50"
                          : "hover:bg-teal-50/50 dark:hover:bg-teal-900/20"
                      }`}
                    >
                      <td className="py-2.5 px-3 flex items-center gap-1.5 font-bold">
                        {row.dayName}
                        {row.isToday && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-teal-600 text-white">
                            Hoy
                          </span>
                        )}
                        {isSelected && !row.isToday && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-teal-800 text-teal-100">
                            Activo
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-teal-800 dark:text-teal-300">
                        {row.formattedDate}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold">
                        {row.salesCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-teal-200/70 dark:bg-teal-800 text-teal-950 dark:text-teal-100 text-[11px]">
                            {row.salesCount}
                          </span>
                        ) : (
                          <span className="text-teal-400 dark:text-teal-600">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-teal-900 dark:text-teal-200">
                        {row.transferencia > 0 ? formatCLP(row.transferencia) : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-teal-900 dark:text-teal-200">
                        {row.contado > 0 ? formatCLP(row.contado) : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-teal-900 dark:text-teal-200">
                        {row.transbank > 0 ? formatCLP(row.transbank) : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-teal-800 dark:text-teal-400">
                        {row.credito > 0 ? formatCLP(row.credito) : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-teal-700 dark:text-teal-400">
                        {row.cortesia > 0 ? formatCLP(row.cortesia) : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-teal-700 dark:text-teal-400">
                        {row.merma > 0 ? formatCLP(row.merma) : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-teal-950 dark:text-teal-100 bg-teal-50 dark:bg-teal-900/30">
                        {formatCLP(row.totalDia)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-teal-900 dark:text-teal-200 bg-teal-100/60 dark:bg-teal-900/70">
                        {formatCLP(row.recaudacionReal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-teal-900 text-teal-50 font-black uppercase text-xs border-t-2 border-teal-700">
                <tr>
                  <td className="py-3 px-3 tracking-wider">TOTAL DEL PERÍODO</td>
                  <td className="py-3 px-3 text-[10px] text-teal-200 font-bold">{periodLabel}</td>
                  <td className="py-3 px-2 text-center text-teal-200">{totals.salesCount}</td>
                  <td className="py-3 px-3 text-right text-teal-200">{formatCLP(totals.transferencia)}</td>
                  <td className="py-3 px-3 text-right text-teal-200">{formatCLP(totals.contado)}</td>
                  <td className="py-3 px-3 text-right text-teal-200">{formatCLP(totals.transbank)}</td>
                  <td className="py-3 px-3 text-right text-teal-300">{formatCLP(totals.credito)}</td>
                  <td className="py-3 px-3 text-right text-teal-300">{formatCLP(totals.cortesia)}</td>
                  <td className="py-3 px-3 text-right text-teal-300">{formatCLP(totals.merma)}</td>
                  <td className="py-3 px-3 text-right text-white font-black bg-teal-950">
                    {formatCLP(totals.totalPeriodo)}
                  </td>
                  <td className="py-3 px-3 text-right text-teal-950 font-black bg-teal-400">
                    {formatCLP(totals.recaudacionReal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DETALLE INTERACTIVO POR DÍA */}
      <Card className="bg-white dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-4 bg-teal-800 text-white flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-300" />
            <CardTitle className="text-sm font-black uppercase tracking-tight">
              Detalle de Ventas del Día: {selectedDayFormatted}
            </CardTitle>
          </div>
          <Badge className="bg-teal-700 text-teal-100 font-bold text-xs uppercase px-2.5 py-0.5">
            {selectedDayDetail.length} {selectedDayDetail.length === 1 ? "Ítem vendido" : "Ítems vendidos"}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {selectedDayDetail.length === 0 ? (
            <div className="p-8 text-center text-teal-700 dark:text-teal-400">
              <p className="text-xs font-semibold">
                No se registraron ventas en esta fecha ({selectedDayFormatted}).
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-teal-100/60 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 font-black uppercase text-[10px] tracking-wider border-b border-teal-200 dark:border-teal-800">
                  <tr>
                    <th className="py-2.5 px-3">Comanda/Código</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Producto/Servicio</th>
                    <th className="py-2.5 px-2 text-center">Cantidad / Kg</th>
                    <th className="py-2.5 px-3 text-right">Precio Unitario</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3">Medio de Pago</th>
                    <th className="py-2.5 px-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-100 dark:divide-teal-900/40">
                  {selectedDayDetail.map((item, idx) => (
                    <tr
                      key={`${item.saleId}-${idx}`}
                      className="hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-black text-teal-900 dark:text-teal-100">
                        {item.comanda}
                      </td>
                      <td className="py-2.5 px-3 text-teal-900 dark:text-teal-200 font-semibold">
                        {item.cliente}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className="border-teal-400 text-teal-800 dark:text-teal-300 text-[10px] uppercase font-bold"
                        >
                          {item.categoria}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-teal-950 dark:text-teal-50">
                        {item.itemNombre}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-teal-900 dark:text-teal-200">
                        {item.cantidad}
                      </td>
                      <td className="py-2.5 px-3 text-right text-teal-800 dark:text-teal-300 font-medium">
                        {formatCLP(item.precioUnitario)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-teal-950 dark:text-teal-100">
                        {formatCLP(item.total)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-900 text-teal-900 dark:text-teal-200">
                          {item.medioPago}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-teal-700 dark:text-teal-400 text-[11px]">
                        {item.observaciones}
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
