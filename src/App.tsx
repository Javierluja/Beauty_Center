import { useEffect } from "react";
import { Routes, Route } from "react-router";
import AuthLayout from "./components/AuthLayout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Ventas from "./pages/Ventas";
import Clientes from "./pages/Clientes";
import Servicios from "./pages/Servicios";
import Productos from "./pages/Productos";
import Notificaciones from "./pages/Notificaciones";
import Gastos from "./pages/Gastos";
import ClienteDetalle from "./pages/ClienteDetalle";
import Personal from "./pages/Personal";
import Cuentas from "./pages/Cuentas";
import Sesiones from "./pages/Sesiones";
import Ajustes from "./pages/Ajustes";
import Compras from "./pages/Compras";

export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      if (!theme) localStorage.setItem('theme', 'dark');
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <AuthLayout>
            <Dashboard />
          </AuthLayout>
        }
      />
      <Route
        path="/agenda"
        element={
          <AuthLayout>
            <Agenda />
          </AuthLayout>
        }
      />
      <Route
        path="/ventas"
        element={
          <AuthLayout>
            <Ventas />
          </AuthLayout>
        }
      />
      <Route
        path="/clientes"
        element={
          <AuthLayout>
            <Clientes />
          </AuthLayout>
        }
      />
      <Route
        path="/clientes/:id"
        element={
          <AuthLayout>
            <ClienteDetalle />
          </AuthLayout>
        }
      />
      <Route
        path="/servicios"
        element={
          <AuthLayout>
            <Servicios />
          </AuthLayout>
        }
      />
      <Route
        path="/productos"
        element={
          <AuthLayout>
            <Productos />
          </AuthLayout>
        }
      />
      <Route
        path="/cuentas"
        element={
          <AuthLayout>
            <Cuentas />
          </AuthLayout>
        }
      />
      <Route
        path="/notificaciones"
        element={
          <AuthLayout>
            <Notificaciones />
          </AuthLayout>
        }
      />
      <Route
        path="/gastos"
        element={
          <AuthLayout>
            <Gastos />
          </AuthLayout>
        }
      />
      <Route
        path="/personal"
        element={
          <AuthLayout>
            <Personal />
          </AuthLayout>
        }
      />
      <Route
        path="/sesiones"
        element={
          <AuthLayout>
            <Sesiones />
          </AuthLayout>
        }
      />
      <Route
        path="/ajustes"
        element={
          <AuthLayout>
            <Ajustes />
          </AuthLayout>
        }
      />
      <Route
        path="/compras"
        element={
          <AuthLayout>
            <Compras />
          </AuthLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
