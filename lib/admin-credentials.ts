// Return configuration guidance only; never include credential values.
export function getAdminCredentialsError(email: string, password: string, production: boolean) {
  if (!email.trim()) return "Set ADMIN_EMAIL in the deployment environment.";
  if (!password.trim()) return "Set ADMIN_PASSWORD in the deployment environment.";
  if (/^\$2[aby]\$\d{2}\$/.test(password.trim())) {
    return "ADMIN_PASSWORD must be a plain password, not a bcrypt hash.";
  }
  if (production && (password.length < 12 || password === "ChangeMe123!")) {
    return "ADMIN_PASSWORD must be a unique password of at least 12 characters; the old default is disabled in production.";
  }
  return null;
}
