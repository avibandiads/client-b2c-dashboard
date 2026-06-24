const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-04-15";

function datePresetToRange(preset: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      return { start, end };
    case "yesterday":
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    case "last_7d":
      start.setDate(start.getDate() - 6);
      return { start, end };
    case "last_14d":
      start.setDate(start.getDate() - 13);
      return { start, end };
    case "last_30d":
      start.setDate(start.getDate() - 29);
      return { start, end };
    default:
      start.setDate(start.getDate() - 6);
      return { start, end };
  }
}

export async function fetchAppointmentCount(
  locationId: string,
  datePreset: string,
  token: string,
): Promise<number> {
  const { start, end } = datePresetToRange(datePreset);

  const params = new URLSearchParams({
    locationId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    limit: "100",
  });

  let total = 0;
  let page = 1;

  while (true) {
    if (page > 1) params.set("skip", String((page - 1) * 100));

    const res = await fetch(`${GHL_API}/calendars/events/appointments?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Version: GHL_VERSION,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      // Non-fatal — return what we have
      console.error(`GHL API error for ${locationId}: ${res.status} ${await res.text()}`);
      break;
    }

    const json = await res.json();
    const appointments: unknown[] = json.appointments ?? json.events ?? [];
    total += appointments.length;

    // No more pages
    if (appointments.length < 100) break;
    page++;
  }

  return total;
}

export async function fetchDailyAppointments(
  locationId: string,
  startDate: Date,
  endDate: Date,
  token: string,
): Promise<Record<string, number>> {
  const params = new URLSearchParams({
    locationId,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    limit: "500",
  });

  const res = await fetch(`${GHL_API}/calendars/events/appointments?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: GHL_VERSION,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`GHL daily fetch error for ${locationId}: ${res.status}`);
    return {};
  }

  const json = await res.json();
  const appointments: Array<{ startTime: string }> = json.appointments ?? json.events ?? [];

  const byDay: Record<string, number> = {};
  for (const appt of appointments) {
    const day = appt.startTime?.slice(0, 10);
    if (day) byDay[day] = (byDay[day] ?? 0) + 1;
  }
  return byDay;
}
