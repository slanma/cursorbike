import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Produkt } from "./produkty";
import { useVsechnyProdukty } from "./produkty-hook";

export type Polozka = { slug: string; pocet: number };

type KosikContext = {
  polozky: Polozka[];
  radky: { produkt: Produkt; pocet: number }[];
  pocetKusu: number;
  celkem: number;
  pridat: (slug: string) => void;
  zmenit: (slug: string, pocet: number) => void;
  odebrat: (slug: string) => void;
  vyprazdnit: () => void;
};

const Ctx = createContext<KosikContext | null>(null);
const KEY = "cursorbike-kosik";

export function KosikProvider({ children }: { children: ReactNode }) {
  const [polozky, setPolozky] = useState<Polozka[]>([]);
  const { produkty: vsechnyProdukty } = useVsechnyProdukty();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPolozky(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(polozky));
    } catch {
      /* ignore */
    }
  }, [polozky]);

  const value = useMemo<KosikContext>(() => {
    const radky = polozky
      .map((p) => {
        const produkt = vsechnyProdukty.find((x) => x.slug === p.slug);
        return produkt ? { produkt, pocet: p.pocet } : null;
      })
      .filter((x): x is { produkt: Produkt; pocet: number } => x !== null);

    return {
      polozky,
      radky,
      pocetKusu: polozky.reduce((s, p) => s + p.pocet, 0),
      celkem: radky.reduce((s, r) => s + r.produkt.cena * r.pocet, 0),
      pridat: (slug) =>
        setPolozky((prev) =>
          prev.some((p) => p.slug === slug)
            ? prev.map((p) => (p.slug === slug ? { ...p, pocet: p.pocet + 1 } : p))
            : [...prev, { slug, pocet: 1 }],
        ),
      zmenit: (slug, pocet) =>
        setPolozky((prev) =>
          pocet <= 0 ? prev.filter((p) => p.slug !== slug) : prev.map((p) => (p.slug === slug ? { ...p, pocet } : p)),
        ),
      odebrat: (slug) => setPolozky((prev) => prev.filter((p) => p.slug !== slug)),
      vyprazdnit: () => setPolozky([]),
    };
  }, [polozky, vsechnyProdukty]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKosik() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKosik musí být uvnitř KosikProvider");
  return ctx;
}
