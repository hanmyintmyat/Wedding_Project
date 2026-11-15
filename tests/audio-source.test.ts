import assert from "node:assert/strict";
import { test } from "node:test";
import { statSync } from "node:fs";
import { resolveWeddingAudio, weddingMusicPath } from "../lib/audio-source";
import { resolveWeddingMedia } from "../config/wedding-media";

test("the trimmed music asset exists and is suitable for deployment", () => {
  const file = statSync(`public${weddingMusicPath}`);
  assert.ok(file.size > 4_000_000 && file.size < 5_500_000);
  assert.equal(resolveWeddingAudio("/music/wildest-dreams.mp3"), weddingMusicPath);
});

test("new audio and custom admin tracks remain unchanged", () => {
  for (const source of [weddingMusicPath, "https://example.public.blob.vercel-storage.com/wedding/custom/song.mp3"]) assert.equal(resolveWeddingAudio(source), source);
});

test("old music records use the trimmed track without changing stored IDs or data", () => {
  const stored = { id: "seed-music", type: "MUSIC", url: "/music/wildest-dreams.mp3", alt: "Wildest Dreams", sortOrder: 0 };
  const resolved = resolveWeddingMedia(stored);
  assert.equal(resolved.url, weddingMusicPath);
  assert.equal(resolved.id, stored.id);
  assert.equal(resolved.sortOrder, stored.sortOrder);
  assert.equal(stored.url, "/music/wildest-dreams.mp3");
});
