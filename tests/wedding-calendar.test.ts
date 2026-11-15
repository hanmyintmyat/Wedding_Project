import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMonthCalendar, weddingStartTimestamp, googleCalendarLink } from "../lib/calendar";
import type { WeddingData } from "../lib/invitation";
import { weddingConfig } from "../config/wedding.config";

test("the January 10 wedding countdown uses the same timezone as calendar links", () => {
  assert.equal(weddingStartTimestamp("2027-01-10T03:30:00.000Z", "10:00 AM"), Date.parse("2027-01-10T03:30:00Z"));
  assert.equal(weddingStartTimestamp("2027-01-10", "12:00 AM"), Date.parse("2027-01-09T17:30:00Z"));
  assert.equal(weddingStartTimestamp("2027-01-10", "12:00 PM"), Date.parse("2027-01-10T05:30:00Z"));
  assert.equal(weddingStartTimestamp("2027-01-10", "14:15"), Date.parse("2027-01-10T07:45:00Z"));
});

test('Add to Calendar includes the updated venue address and MRT directions', () => {
  const data = {
    settings: {
      groomName: weddingConfig.groom, brideName: weddingConfig.bride,
      weddingDate: weddingConfig.date, startTime: weddingConfig.startTime, endTime: weddingConfig.endTime,
      venueName: weddingConfig.venue, venueAddress: weddingConfig.address, venueDirections: weddingConfig.venueDirections
    },
    content: { englishIntro: 'Celebrate with us.' }
  } as WeddingData;
  const calendar = new URL(googleCalendarLink(data));
  assert.equal(calendar.searchParams.get('location'), 'CALI @ Ascott Raffles Place, 2 Finlayson Green, Level 2, Singapore 049247');
  assert.ok(calendar.searchParams.get('details')?.includes('Raffles Place MRT Exit I'));
  assert.equal(calendar.searchParams.get('ctz'), 'Asia/Yangon');
});

test("the existing calendar still highlights January 10, 2027", () => {
  const calendar = buildMonthCalendar("2027-01-10T03:30:00.000Z");
  assert.equal(calendar.monthLabel, "JANUARY 2027");
  assert.equal(calendar.highlightedDay, 10);
  assert.equal(calendar.cells.indexOf(10) % 7, 0);
});
