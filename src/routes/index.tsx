import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, CreditCard, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reservalo — Reservas online para tu negocio" },
      {
        name: "description",
        content:
          "Software de reservas para masajistas, peluquerías, fisioterapeutas y entrenadores. Prueba gratis 14 días, sin tarjeta.",
      },
      { property: "og:title", content: "Reservalo — Reservas online para tu negocio" },
      {
        property: "og:description",
        content: "Gestiona citas, servicios y profesionales. Prueba gratis 14 días.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/onboarding" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold text-foreground">Reservalo</span>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">Empezar gratis</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <span className="inline-flex items-center rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
          Prueba gratuita: 14 días sin tarjeta
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Reservas online para tu negocio
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Masajistas, peluquerías, fisioterapeutas, entrenadores y clases privadas.
          Configura tu agenda en minutos y empieza a recibir reservas.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/signup">Crear cuenta gratis</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">Ya tengo cuenta</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarCheck, title: "Agenda online" },
            { icon: Clock, title: "Buffers y horarios" },
            { icon: Users, title: "Equipo y salas" },
            { icon: CreditCard, title: "Pagos y facturas" },
          ].map(({ icon: Icon, title }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5 text-left">
              <Icon className="h-6 w-6 text-primary" />
              <p className="mt-3 font-medium text-card-foreground">{title}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
