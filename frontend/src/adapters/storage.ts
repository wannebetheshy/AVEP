import type { Session } from "../domain/types";

const STORAGE_KEY = "avep.session";

const safeParse = (value: string | null): Session | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Session;
    if (!parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const getStoredSession = () => {
  if (typeof localStorage === "undefined") return null;

  return safeParse(localStorage.getItem(STORAGE_KEY));
};

export const setStoredSession = (session: Session) => {
  if (typeof localStorage === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearStoredSession = () => {
  if (typeof localStorage === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
};
