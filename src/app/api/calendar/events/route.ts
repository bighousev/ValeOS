import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const db = await createClient();
  const { data: claims } = await db.auth.getClaims();
  if (!claims?.claims?.sub)
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { data: profile } = await db
    .from("profiles")
    .select("id")
    .eq("id", claims.claims.sub)
    .eq("active", true)
    .single();
  if (!profile)
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!email || !key || !calendarId)
    return NextResponse.json({ events: [], status: "not_configured" });
  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: email,
        private_key: key.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });
    const token = await auth.getAccessToken();
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 24 * 60 * 60_000);
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    );
    url.searchParams.set("timeMin", start.toISOString());
    url.searchParams.set("timeMax", end.toISOString());
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "50");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("calendar unavailable");
    const data = await response.json();
    const events = (data.items || []).map(
      (item: {
        id: string;
        summary?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
      }) => ({
        id: item.id,
        title: item.summary || "Evento sem título",
        start: item.start?.dateTime || item.start?.date,
        end: item.end?.dateTime || item.end?.date,
      }),
    );
    return NextResponse.json(
      { events, status: "ok" },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { events: [], status: "unavailable" },
      { status: 503 },
    );
  }
}
