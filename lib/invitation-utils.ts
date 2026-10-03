export function greetingFor(template: string, guestName?: string | null) {
  const name = guestName?.trim() || "Beloved Guest";
  return template.replace("{name}", name);
}

export function slugifyName(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "guest";
}
