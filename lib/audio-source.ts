export const weddingMusicPath = "/music/wildest-dreams-trimmed.mp3";

export function resolveWeddingAudio(url: string) {
  // Existing database records keep their IDs and stored URLs. Custom admin
  // uploads remain authoritative; only the original bundled track is replaced.
  return url === "/music/wildest-dreams.mp3" ? weddingMusicPath : url;
}
