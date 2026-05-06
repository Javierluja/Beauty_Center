import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Gastos() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: expenses, isLoading } = trpc.expense.list.useQuery();
  
  const createExpense = trpc.expense.create.useMutation({
    onSuccess: () => {
      utils.expense.list.invalidate();
      setIsOpen(false);
      toast({ title: "Gasto registrado" });
    },
  });

  const deleteExpense = trpc.expense.delete.useMutation({
    onSuccess: () => {
      utils.expense.list.invalidate();
      toast({ title: "Gasto eliminado" });
    },
  });

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createExpense.mutate({
      description: formData.get("description") as string,
      amount: formData.get("amount") as string,
      category: formData.get("category") as string,
      date: formData.get("date") as string,
      notes: formData.get("notes") as string,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Gestión de Gastos</h1>
          <p className="text-xs text-muted-foreground mt-1">Control de egresos y facturas</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 font-black shadow-lg h-12 w-full md:w-auto px-8 rounded-2xl">
              <Plus className="h-5 w-5 mr-2" /> NUEVO GASTO
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input id="description" name="description" required placeholder="Ej: Pago de alquiler" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto ($)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input id="category" name="category" required placeholder="Insumos, Alquiler, Sueldos, etc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button type="submit" className="w-full" disabled={createExpense.isPending}>
                {createExpense.isPending ? "Guardando..." : "Guardar Gasto"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-border bg-card shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border px-5 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Total Egresos Hoy</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-5 py-4">
            <div className="text-2xl font-black text-foreground">${Math.floor(totalExpenses).toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Gastos acumulados del día</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border bg-card shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border px-6 py-4">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" /> Historial de Egresos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-[10px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-border">
                <tr>
                  <th className="px-6 py-5">Fecha</th>
                  <th className="px-6 py-5">Descripción</th>
                  <th className="px-6 py-5">Categoría</th>
                  <th className="px-6 py-5 text-right">Monto</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses?.map((expense) => (
                  <tr key={expense.id} className="hover:bg-admin-panel transition-colors">
                    <td className="px-6 py-5 text-muted-foreground text-xs">
                      {new Date(expense.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-5 font-semibold text-foreground uppercase text-xs">
                      {expense.description}
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-[10px] font-medium uppercase border border-border">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-destructive text-lg">
                      -${Math.floor(Number(expense.amount)).toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExpense.mutate(expense.id)}
                        disabled={deleteExpense.isPending}
                        className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl border border-destructive/10"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {!isLoading && expenses?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-20 text-xs font-black text-slate-400 uppercase italic tracking-widest">
                      No hay gastos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
