import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConsent, setConsent } from "@/lib/consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (getConsent() === null) {
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;

  const decide = (v: "granted" | "denied") => {
    setConsent(v);
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-white/10 bg-black/85 backdrop-blur-xl p-4 shadow-2xl md:left-6 md:right-auto md:bottom-6"
    >
      <p className="text-sm text-slate-200 leading-relaxed">
        Usamos cookies para entender o tráfego do site (Google Analytics, IP anonimizado).
        Veja a{" "}
        <Link to="/privacidade" className="underline text-[#00A651] hover:opacity-80">
          política de privacidade
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => decide("denied")}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 text-slate-100 hover:bg-white/15 transition"
        >
          Recusar
        </button>
        <button
          onClick={() => decide("granted")}
          className="px-4 py-2 rounded-xl text-sm font-bold bg-[#00A651] text-white hover:opacity-90 transition"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
