import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CONSENT_EVENT, getConsent } from "@/lib/consent";

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

/**
 * GA4 com Google Consent Mode v2.
 * - Carrega o script SOMENTE após consentimento.
 * - IP anonimizado, ad-signals desligados.
 */
export default function GoogleAnalytics() {
  const location = useLocation();
  const [consent, setConsentState] = useState(getConsent());

  // Reage a mudanças no banner de cookies
  useEffect(() => {
    const handler = (e: Event) => {
      setConsentState((e as CustomEvent).detail as "granted" | "denied");
    };
    window.addEventListener(CONSENT_EVENT, handler);
    return () => window.removeEventListener(CONSENT_EVENT, handler);
  }, []);

  // Inicializa GA + Consent Mode
  useEffect(() => {
    if (!measurementId) return;

    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
    }

    // Default: tudo negado até o usuário aceitar
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });

    if (consent !== "granted") return;

    window.gtag("consent", "update", { analytics_storage: "granted" });

    if (!document.getElementById("ga-script")) {
      const s = document.createElement("script");
      s.id = "ga-script";
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(s);
    }

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  }, [consent]);

  // Pageview SPA
  useEffect(() => {
    if (!measurementId || consent !== "granted" || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: `${location.pathname}${location.search}`,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search, consent]);

  return null;
}

/** Helper p/ disparar eventos custom (whatsapp_click, add_to_cart, etc.) */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
