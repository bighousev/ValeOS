export function localDateKey(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const pick = (type: string) =>
    parts.find((p) => p.type === type)?.value || "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function shiftDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function localMidnightUtc(dateKey: string, timeZone: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  let guess = target;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 4; i++) {
    const parts = formatter.formatToParts(new Date(guess));
    const get = (key: string) =>
      Number(parts.find((p) => p.type === key)?.value);
    const observed = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    const correction = target - observed;
    guess += correction;
    if (correction === 0) break;
  }
  return new Date(guess).toISOString();
}

export function completeWeekWindows(now: Date, timeZone = "America/Sao_Paulo") {
  const today = localDateKey(now, timeZone);
  return {
    current: {
      start: localMidnightUtc(shiftDate(today, -7), timeZone),
      end: localMidnightUtc(today, timeZone),
    },
    previous: {
      start: localMidnightUtc(shiftDate(today, -14), timeZone),
      end: localMidnightUtc(shiftDate(today, -7), timeZone),
    },
  };
}

export function latestWonEvents(
  events: {
    opportunity_id: string;
    to_stage: string;
    confirmed_value: number | null;
    occurred_at: string;
  }[],
  currentStages: Map<string, string>,
  start: string,
  end: string,
) {
  const last = new Map<string, (typeof events)[number]>();
  for (const event of events)
    if (
      !last.has(event.opportunity_id) ||
      event.occurred_at > last.get(event.opportunity_id)!.occurred_at
    )
      last.set(event.opportunity_id, event);
  return [...last.values()].filter(
    (e) =>
      e.to_stage === "Ganho" &&
      currentStages.get(e.opportunity_id) === "Ganho" &&
      e.occurred_at >= start &&
      e.occurred_at < end,
  );
}
