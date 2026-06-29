import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock, Loader2, MapPin, History as HistoryIcon, XCircle } from "lucide-react";
import {
  getBooking,
  getSlots,
  getAvailability,
  rescheduleBookingFn,
  cancelBookingFn,
} from "@/lib/booking/public.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-booking/$token")({
  head: () => ({ meta: [{ title: "Mi reserva" }] }),
  loader: ({ params }) => getBooking({ data: { token: params.token } }),
  errorComponent: () => <Centered>No pudimos cargar tu reserva.</Centered>,
  notFoundComponent: () => <Centered>Reserva no encontrada.</Centered>,
  component: MyBookingPage,
});

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <p className="text-center text-muted-foreground">{children}</p>
    </div>
  );
}

type Slot = { iso: string; professionalId: string | null };

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente de pago",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

function MyBookingPage() {
  const { token } = Route.useParams();
  const initial = Route.useLoaderData();
  const qc = useQueryClient();
  const fetchBooking = useServerFn(getBooking);

  const { data } = useQuery({
    queryKey: ["booking", token],
    queryFn: () => fetchBooking({ data: { token } }),
    initialData: initial,
  });

  const [rescheduling, setRescheduling] = useState(false);

  if (!data) return <Centered>Reserva no encontrada.</Centered>;
  const { appointment, tenant, service, professional, history, policy } = data;
  const cancelled = appointment.estado === "cancelled";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <h1 className="text-lg font-bold text-foreground">{tenant?.nombre}</h1>
          <p className="text-xs text-muted-foreground">Gestión de tu reserva</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-6">
        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-card-foreground">{service?.nombre}</h2>
            <Badge variant={cancelled ? "destructive" : "secondary"}>
              {STATUS_LABELS[appointment.estado] ?? appointment.estado}
            </Badge>
          </div>
          <p className="flex items-center gap-2 text-sm text-foreground">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {fmtDateTime(appointment.hora_inicio)}
          </p>
          {professional && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> Con {professional.nombre}
            </p>
          )}
          {appointment.notas && (
            <p className="whitespace-pre-line rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {appointment.notas}
            </p>
          )}
        </Card>

        {!cancelled && (
          <Card className="space-y-4 p-5">
            <h3 className="text-sm font-semibold text-foreground">Gestionar reserva</h3>
            {policy.canManage ? (
              <>
                {!rescheduling ? (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setRescheduling(true)}>
                      <Clock className="mr-1 h-4 w-4" /> Cambiar fecha/hora
                    </Button>
                    <CancelDialog
                      token={token}
                      penalizacion={policy.penalizacion}
                      onDone={() => qc.invalidateQueries({ queryKey: ["booking", token] })}
                    />
                  </div>
                ) : (
                  <Reschedule
                    token={token}
                    slug={tenant?.slug ?? ""}
                    serviceId={service?.id ?? ""}
                    professionalId={professional?.id ?? null}
                    onCancel={() => setRescheduling(false)}
                    onDone={() => {
                      setRescheduling(false);
                      qc.invalidateQueries({ queryKey: ["booking", token] });
                    }}
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Esta reserva ya no se puede modificar ni cancelar online (plazo mínimo:{" "}
                {policy.cancelHours} h antes). Contacta directamente con el negocio.
              </p>
            )}
          </Card>
        )}

        {history.length > 0 && (
          <Card className="space-y-3 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <HistoryIcon className="h-4 w-4" /> Tus citas anteriores
            </h3>
            <ul className="divide-y divide-border">
              {history.map((h: (typeof history)[number]) => (
                <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-foreground">
                    {h.servicio ?? "Cita"} · {fmtDateTime(h.hora_inicio)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {STATUS_LABELS[h.estado] ?? h.estado}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {tenant?.slug && (
            <Link to="/book/$slug" params={{ slug: tenant.slug }} className="hover:underline">
              Reservar otra cita
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}

function CancelDialog({
  token,
  penalizacion,
  onDone,
}: {
  token: string;
  penalizacion: number;
  onDone: () => void;
}) {
  const cancel = useServerFn(cancelBookingFn);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      await cancel({ data: { token } });
      toast.success("Reserva cancelada");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cancelar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <XCircle className="mr-1 h-4 w-4" /> Cancelar reserva
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cancelar tu reserva?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer.
            {Number(penalizacion) > 0 &&
              ` Puede aplicarse una penalización de cancelación de ${penalizacion}%.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Volver</AlertDialogCancel>
          <AlertDialogAction onClick={run} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sí, cancelar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function Reschedule({
  token,
  slug,
  serviceId,
  professionalId,
  onCancel,
  onDone,
}: {
  token: string;
  slug: string;
  serviceId: string;
  professionalId: string | null;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [month, setMonth] = useState(new Date());
  const [date, setDate] = useState<Date | undefined>();
  const [slot, setSlot] = useState<Slot | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAvailability = useServerFn(getAvailability);
  const fetchSlots = useServerFn(getSlots);
  const reschedule = useServerFn(rescheduleBookingFn);

  const { data: availability } = useQuery({
    queryKey: ["availability", slug, month.getFullYear(), month.getMonth() + 1],
    queryFn: () =>
      fetchAvailability({ data: { slug, year: month.getFullYear(), month: month.getMonth() + 1 } }),
    enabled: !!slug,
  });
  const availableSet = useMemo(() => new Set(availability?.availableDates ?? []), [availability]);

  const { data: slotsData, isFetching } = useQuery({
    queryKey: ["slots", slug, serviceId, professionalId, date && ymd(date)],
    queryFn: () =>
      fetchSlots({ data: { slug, serviceId, professionalId, date: ymd(date!) } }),
    enabled: !!date && !!serviceId,
  });

  const save = async () => {
    if (!slot) return;
    setSaving(true);
    try {
      await reschedule({ data: { token, startIso: slot.iso } });
      toast.success("Reserva actualizada");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo modificar");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        month={month}
        onMonthChange={setMonth}
        selected={date}
        onSelect={(d) => {
          setDate(d);
          setSlot(null);
        }}
        disabled={(d) => !availableSet.has(ymd(d))}
        className="pointer-events-auto mx-auto"
      />
      {date && (
        <div>
          {isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
            </div>
          ) : (slotsData?.slots.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No hay huecos disponibles este día.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slotsData!.slots.map((sl) => (
                <button
                  key={sl.iso}
                  onClick={() => setSlot(sl)}
                  className={cn(
                    "rounded-lg border py-2 text-sm font-medium transition-colors",
                    slot?.iso === sl.iso
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-accent",
                  )}
                >
                  {fmtTime(sl.iso)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button className="flex-1" onClick={save} disabled={!slot || saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
