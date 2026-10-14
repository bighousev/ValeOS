"use client";
import { useEffect, useState } from "react";

type Event = { id: string; title: string; start?: string };
export function CalendarPreview() {
  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    fetch("/api/calendar/events")
      .then(async (r) => {
        const data = await r.json();
        setEvents(data.events || []);
        setStatus(data.status || "unavailable");
      })
      .catch(() => setStatus("unavailable"));
  }, []);
  return (
    <section className="surface detail-section calendar-preview">
      <div className="section-heading">
        <div>
          <span className="eyebrow">GOOGLE CALENDAR · LEITURA</span>
          <h2>Agenda compartilhada</h2>
        </div>
      </div>
      {status === "loading" ? (
        <p className="muted">Carregando calendário...</p>
      ) : status === "not_configured" ? (
        <p className="muted">
          A conexão com o calendário ainda não foi configurada.
        </p>
      ) : status === "unavailable" ? (
        <p className="muted">
          O calendário externo está indisponível. As reuniões do ValeOS
          continuam acessíveis.
        </p>
      ) : !events.length ? (
        <p className="muted">Nenhum evento externo nos próximos 30 dias.</p>
      ) : (
        <div className="compact-list">
          {events.slice(0, 8).map((event) => (
            <div key={event.id}>
              <strong>{event.title}</strong>
              <small>
                {event.start
                  ? new Date(event.start).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "Data a confirmar"}
              </small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
