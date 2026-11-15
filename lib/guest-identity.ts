import { createHash } from "node:crypto";
import { slugifyName } from "./invitation-utils";

export function guestSlug(name: string) {
  const fullName = name.trim();
  // Preserve punctuation differences while giving concurrent requests one key.
  const identity = createHash("sha256").update(fullName.toLowerCase()).digest("hex").slice(0, 16);
  return `${slugifyName(fullName)}-${identity}`;
}
