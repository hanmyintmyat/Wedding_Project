export function greetingFor(template: string, guestName?: string | null) {
  const name = guestName?.trim() || "Beloved Guest";
  return template.replace("{name}", name);
}

export function slugifyName(name: string) {
  return name.toLowerCase().trim().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/(^-|-$)/g, "") || "guest";
}
