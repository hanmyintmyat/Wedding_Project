import assert from "node:assert/strict";
import { test } from "node:test";
import { buildVenueMapsLinks, isEmbeddedBrowser } from "../lib/venue-links";

const venue = { latitude: null, longitude: null, venueAddress: "2 Finlayson Green, Singapore 049247", venueName: "Cali" };

test("Maps uses universal HTTPS search/directions URLs and coordinates first", () => {
  const links = buildVenueMapsLinks({ ...venue, latitude: 1.281, longitude: 103.851 });
  for (const [key, value] of Object.entries(links)) {
    const url = new URL(value);
    assert.equal(url.origin, "https://www.google.com");
    assert.equal(url.searchParams.get("api"), "1");
    assert.equal(url.searchParams.get(key === "location" ? "query" : "destination"), "1.281,103.851");
  }
  assert.equal(new URL(links.location).pathname, "/maps/search/");
  assert.equal(new URL(links.directions).pathname, "/maps/dir/");
  assert.equal(new URL(buildVenueMapsLinks({ ...venue, latitude: 0, longitude: 0 }).location).searchParams.get("query"), "0,0");
});

test("Maps safely encodes the configured address, including Unicode and URL punctuation", () => {
  const address = "Cali @ Raffles Place\n2 Finlayson Green #02-01 & မင်္ဂလာ";
  const links = buildVenueMapsLinks({ ...venue, venueAddress: address });
  assert.equal(new URL(links.location).searchParams.get("query"), address);
  assert.equal(new URL(links.directions).searchParams.get("destination"), address);
  assert.ok(links.location.includes(encodeURIComponent(address)));
});

test("venue name is the final fallback when the address is missing", () => {
  const links = buildVenueMapsLinks({ ...venue, venueAddress: "  " });
  assert.equal(new URL(links.directions).searchParams.get("destination"), venue.venueName);
});

test("incomplete or invalid coordinates do not override a usable address", () => {
  for (const [latitude, longitude] of [[1, null], [NaN, 1], [91, 1], [1, 181]] as Array<[number, number | null]>) {
    assert.equal(new URL(buildVenueMapsLinks({ ...venue, latitude, longitude }).location).searchParams.get("query"), venue.venueAddress);
  }
});

test("embedded-browser hints recognize common app markers", () => {
  for (const ua of ["FBAN/MessengerForiOS", "FBAV/400.0 FB_IAB", "Instagram 300.0", "Mozilla/5.0 Line/13.0", "WhatsApp/2.0", "TikTok 32"]) assert.equal(isEmbeddedBrowser(ua), true, ua);
});

test("ordinary Chrome and Safari do not display embedded-browser guidance", () => {
  for (const ua of ["Mozilla/5.0 Chrome/130.0 Safari/537.36", "Mozilla/5.0 iPhone Version/18.0 Mobile Safari/604.1", "Mozilla/5.0 Android Chrome/130.0 Mobile Safari/537.36"]) assert.equal(isEmbeddedBrowser(ua), false);
});
