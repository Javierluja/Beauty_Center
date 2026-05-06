import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Card className="w-full max-w-sm text-center bg-admin-panel border-2 border-primary/10 rounded-[2.5rem] shadow-2xl">
        <CardHeader className="pt-8">
          <CardTitle className="text-6xl font-black text-primary uppercase tracking-tighter">404</CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <p className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Página no encontrada</p>
          <Button asChild className="w-full h-12 rounded-2xl bg-primary font-black uppercase shadow-lg">
            <Link to="/">Volver al Inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
