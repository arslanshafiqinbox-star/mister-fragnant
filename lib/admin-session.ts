export const ADMIN_TOKEN_KEY = "adminAccessToken";
export const ADMIN_EMAIL_KEY = "adminEmail";
export const ADMIN_TOKEN = "23771459-36031363-42942554-97706434";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function isAdminSignedIn(): boolean {
  return Boolean(getAdminToken());
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_EMAIL_KEY);
}
