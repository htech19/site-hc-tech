// LGPD/GDPR consent state — fonte única de verdade
const STORAGE_KEY = "hctech-consent";
export const CONSENT_EVENT = "hctech:consent-change";

export type ConsentValue = "granted" | "denied" | null;

export function getConsent(): ConsentValue {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: "granted" | "denied") {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    // localStorage indisponível (modo privado/incógnito): segue sem persistir
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
}
