import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";

const KLIC = "cursorbike-cookies";

type Volba = "vse" | "nezbytne";

export function otevriNastaveniCookies() {
  window.dispatchEvent(new CustomEvent("cursorbike:cookies"));
}

export function CookieLista() {
  const [zobrazit, setZobrazit] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KLIC)) setZobrazit(true);
    const otevri = () => setZobrazit(true);
    window.addEventListener("cursorbike:cookies", otevri);
    return () => window.removeEventListener("cursorbike:cookies", otevri);
  }, []);

  const uloz = (volba: Volba) => {
    localStorage.setItem(KLIC, JSON.stringify({ volba, datum: new Date().toISOString() }));
    setZobrazit(false);
  };

  if (!zobrazit) return null;

  return (
    <div
      role="dialog"
      aria-label="Nastavení cookies"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-ink-foreground/15 bg-ink text-ink-foreground shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:px-6">
        <Cookie className="hidden h-8 w-8 shrink-0 text-primary md:block" aria-hidden />
        <div className="text-sm text-ink-muted">
          <p className="font-semibold text-ink-foreground">Používáme cookies</p>
          <p className="mt-1">
            Nezbytné cookies web potřebuje k fungování (košík, přihlášení). Analytické a marketingové použijeme jen
            s vaším souhlasem. Souhlas můžete kdykoli odvolat. Více v{" "}
            <Link to="/ochrana-osobnich-udaju" className="text-primary hover:underline">
              zásadách zpracování osobních údajů
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:ml-auto">
          <button
            type="button"
            onClick={() => uloz("nezbytne")}
            className="inline-flex h-11 items-center justify-center rounded-md border border-ink-foreground/25 px-5 text-sm font-semibold transition-colors hover:bg-ink-foreground/10"
          >
            Jen nezbytné
          </button>
          <button
            type="button"
            onClick={() => uloz("vse")}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Přijmout vše
          </button>
        </div>
      </div>
    </div>
  );
}
