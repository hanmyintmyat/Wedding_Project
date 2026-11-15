import assert from "node:assert/strict";
import { test } from "node:test";
import { guestSlug } from "../lib/guest-identity";

test("one guest keeps the same identity across casing and surrounding spaces", () => {
  assert.equal(guestSlug("  Phyo Thandar Aung  "), guestSlug("phyo thandar aung"));
});

test("different names remain distinct when a readable slug would collide", () => {
  const names = ["Aye Aye", "Aye-Aye", "Aye.Aye", "Aye!Aye", "Aye_Aye"];
  assert.equal(new Set(names.map(guestSlug)).size, names.length);
});

test("punctuation differences in Unicode names remain distinct", () => {
  assert.notEqual(guestSlug("မင်္ဂလာပါ မိသားစု"), guestSlug("မင်္ဂလာပါ-မိသားစု"));
});
