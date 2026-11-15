# Wedding audio and Maps compatibility update

This update changes only the existing invitation's bundled audio, music controls, and venue actions. The photos, design, RSVP business logic, admin authentication, Prisma schema/migrations, wedding settings, calendar, countdown, dress code, and Vercel environment configuration remain intact.

## Actual MP3 inspection and edit

Original files:

- `public/music/wildest-dreams.mp3`
- `Duomo - Wildest Dreams.mp3`

Both originals have SHA-256 `4d84838b2fc54229717a70b8e2f477fc22e2bf7aa12f16050cbde9d371be5e0e`. They were identical 256 kbps stereo MP3s, 48 kHz, duration 205.781333 seconds, 6,594,850 bytes each.

FFmpeg `silencedetect` was run at -40, -45, -50, -60, and -70 dBFS. The first meaningful attack crosses -45 dBFS at 0.403125 seconds. The earlier very quiet levels were also inspected in 50 ms decoded-sample windows, so the edit does not blindly remove the first musical attack.

Trimmed exactly **0.203125 seconds** (9,750 stereo sample frames at 48 kHz), retaining a **200 ms natural buffer** before the detected attack. No ending or meaningful musical passage was removed. No normalization, gain boost, or added fade was applied.

```bash
ffmpeg -i public/music/wildest-dreams.mp3 \
  -map 0:a:0 -af 'atrim=start=0.203125,asetpts=PTS-STARTPTS' \
  -c:a libmp3lame -b:a 192k -ar 48000 -ac 2 \
  -map_metadata -1 -id3v2_version 3 -write_xing 1 \
  public/music/wildest-dreams-trimmed.mp3
```

Verified output:

| Property | Result |
| --- | --- |
| Asset | `public/music/wildest-dreams-trimmed.mp3` |
| Duration | 205.578208 seconds, or 3:25.578 |
| Size | 4,935,212 bytes; 4.94 MB / 4.71 MiB |
| Encoding | MP3, 192 kbps, stereo, 48 kHz |
| Leading buffer after encode | 0.200 seconds at the same -45 dBFS threshold |
| First-attack waveform correlation to aligned original | 0.99988047 |
| Full-file decode | Passed without FFmpeg decode errors |

The old public file and duplicate root file were removed from the tracked deployment assets only after verification. Both are preserved under ignored `.local/audio-maps/original-audio/`. The trimmed file is the only public music asset.

## Playback and controls

- The Open Invitation handler calls `audio.play()` directly during the same click, before opening state and animations. No audible autoplay occurs before interaction.
- Metadata preloading and the smaller encoded file reduce startup work while leaving playback dependent on the guest's click.
- One persistent audio element remains mounted. Play/pause and volume-change events drive the displayed state; rerenders do not reset the track.
- Play, pause, mute, and unmute are available at every viewport. The desktop volume slider adjusts the same audio element; it is hidden on compact screens.
- Controls stay in the existing reserved dock beside navigation and cannot cover RSVP, venue actions, gallery, or other content.
- `lib/audio-source.ts` maps the original bundled URL to the trimmed asset. The public loader, application fallback, authenticated media library, and migration utility all agree on that source. Stored music IDs/URLs and future custom admin uploads are preserved without production writes. The shared cache version was updated.

Browsers restrict script-initiated audible playback; the app uses the existing interaction rather than depending on autoplay. See [HTMLMediaElement.play documentation](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play).

## Maps and clipboard behavior

`lib/venue-links.ts` creates standard HTTPS Google Maps URLs:

- View Location: `https://www.google.com/maps/search/?api=1&query=...`
- Directions: `https://www.google.com/maps/dir/?api=1&destination=...`

Both use valid latitude/longitude first, then the configured address, then the venue name. Values use `encodeURIComponent`. Zero coordinates are valid; missing/non-finite/out-of-range pairs fall back to the address. The existing Maps iframe and calendar link remain available.

Links are ordinary anchors with `target="_blank"` and `rel="noopener noreferrer"`. There is no router navigation, click interception, custom app protocol, or intent URL. Google's [universal Maps URL documentation](https://developers.google.com/maps/documentation/urls/get-started) describes this cross-platform format.

Copy Address copies the configured address and displays `Address copied` only after success. It tries the modern Clipboard API, then the legacy browser copy action if permission is denied/unavailable. If both fail, it shows a selected, read-only address field with manual-copy guidance. The modern API's secure-context/permission requirements are documented in [Clipboard.writeText](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText).

A small hint appears for recognized Messenger, Facebook, Instagram, WhatsApp, LINE, WeChat, and TikTok markers:

> Maps not opening? Tap ••• and choose Open in Browser.

Detection is best-effort and never changes or blocks the HTTPS links. The copy fallback is available independently of user-agent detection. The buttons stack on small phones, use two columns on tablets, and four columns on wider screens.

## Validation and practical limits

- `npx prisma validate`, `npx prisma generate`, `npm run lint`, and `npm run build`: passed on Node 22.23.1 / Next.js 16.4.6.
- All **20 automated tests** passed, including new source-compatibility, Maps encoding/priority, and embedded-browser marker coverage.
- FFmpeg inspected, trimmed, re-encoded, silence-tested, waveform-compared, and fully decoded the actual output MP3.
- Real Chromium playback used one Open Invitation click with active user activation. An audio analyser first detected music around 0.235 seconds into the media timeline, about 366 ms after the click in that local test. Network/device conditions affect real startup time.
- Real playback continued while scrolling; pause/resume, mute/unmute, volume, and persistent audio-element identity all passed.
- Responsive checks passed at **320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1440, and 1920 px**, with no horizontal overflow or music/navigation/content overlap.
- Actual clipboard writes/reads passed through both the modern API and legacy fallback. A denied-copy test verified the selected manual-copy field and no false success message.
- Chromium user-agent simulations covered Chrome desktop/Android, Safari iPhone/iPad, Messenger, Facebook, Instagram, WhatsApp, and LINE. They verified HTTPS links and hint behavior. These are **not physical app or Safari-engine tests**; actual parent-app navigation policies cannot be certified from user-agent simulation.
- The previous full production-build regression suite passed again: 13 viewport widths, personalization, RSVP accept/decline/refresh, private wishes, calendar/countdown, dress code, gallery keyboard use, admin login/pages/media ordering. All write tests used the disposable local database.
- The existing media-validation and sanitized database-failure browser checks passed.
- A read-only test using the existing configured database confirmed the trimmed track plays, the real venue address appears in Directions and copies correctly, the Messenger hint displays, and `/api/health` returns HTTP 200 with both statuses `ok`.
- Before/after production table checksums matched for guests, RSVPs, wedding settings/content, photos/music records, users, colors, sections, and theme. No database or production environment values were changed.

Browser reports, FFmpeg logs, metadata, waveform correlation, and screenshots are retained under ignored `.local/audio-maps/`. No temporary test harness or credentials are part of the release.

## Release

Requested commit message: `Trim wedding audio intro and improve maps compatibility`.

A successful normal push to `origin main` should trigger the existing Vercel integration. Deployment status and the commit hash are reported separately after the push attempt. Local checks do not certify a live release. After Vercel is Ready, check first-tap sound and Maps/clipboard behavior on actual iPhone/Android devices and in Messenger/Facebook/Instagram/WhatsApp, plus admin, RSVP, and health checks. Use authorized synthetic records for live write tests; never overwrite real guests' responses.
