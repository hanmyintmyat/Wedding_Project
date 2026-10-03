import type { WeddingData } from "./invitation";

export function formatDisplayDate(dateValue: string) {
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Yangon"
  }).format(date);
}

export function buildMonthCalendar(dateValue: string) {
  const date = new Date(dateValue);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const highlightedDay = date.getUTCDate();
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = first.getUTCDay();
  const cells: Array<number | null> = [];
  for (let index = 0; index < offset; index++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return {
    monthLabel: new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(first).toUpperCase(),
    highlightedDay,
    cells
  };
}

function parseTime(date: string, time: string) {
  const match = time.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return `${date.replaceAll("-", "")}T000000`;
  let hour = Number(match[1]);
  const minute = Number(match[2] || "00");
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${date.replaceAll("-", "")}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;
}

export function googleCalendarLink(data: WeddingData) {
  const title = `${data.settings.groomName} & ${data.settings.brideName} Wedding`;
  const date = data.settings.weddingDate.slice(0, 10);
  const dates = `${parseTime(date, data.settings.startTime)}/${parseTime(date, data.settings.endTime)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    ctz: "Asia/Yangon",
    location: `${data.settings.venueName}, ${data.settings.venueAddress}`,
    details: data.content.englishIntro
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
