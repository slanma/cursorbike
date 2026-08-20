import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Produkt } from "./produkty";
import { useVsechnyProdukty } from "./produkty-hook";

export type Polozka = { slug: string; velikost?: string; pocet: number };

export type Radek = { klic: string; produkt: Produkt; velikost?: string; pocet: number };

type KosikContext = {
  polozky: Polozka[];
  radky: Radek[];
  pocetKusu: number;
  celkem: number;
  pridat: (slug: string, velikost?: string) => void;
  zmenit: (klic: string, pocet: number) => void;
  odebrat: (klic: string) => void;
  vyprazdnit: () => void;
};

const Ctx = createContext<KosikContext | null>(null);
const KEY = "cursorbike-kosik";

/**
 * Klíč řádku v košíku. Stejné kolo ve dvou velikostech rámu jsou dva
 * samostatné řádky, proto nestačí slug.
 */
const klicPolozky = (slug: string, velikost?: string) => `${slug}|${velikost ?? ""}`;

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
    const radky: Radek[] = polozky.flatMap((p) => {
      const produkt = vsechnyProdukty.find((x) => x.slug === p.slug);
      if (!produkt) return [];
      return [
        {
          klic: klicPolozky(p.slug, p.velikost),
          produkt,
          pocet: p.pocet,
          ...(p.velikost ? { velikost: p.velikost } : {}),
        },
      ];
    });

    return {
      polozky,
      radky,
      pocetKusu: polozky.reduce((s, p) => s + p.pocet, 0),
      celkem: radky.reduce((s, r) => s + r.produkt.cena * r.pocet, 0),
      pridat: (slug, velikost) =>
        setPolozky((prev) => {
          const klic = klicPolozky(slug, velikost);
          return prev.some((p) => klicPolozky(p.slug, p.velikost) === klic)
            ? prev.map((p) =>
                klicPolozky(p.slug, p.velikost) === klic ? { ...p, pocet: p.pocet + 1 } : p,
              )
            : [...prev, { slug, ...(velikost ? { velikost } : {}), pocet: 1 }];
        }),
      zmenit: (klic, pocet) =>
        setPolozky((prev) =>
          pocet <= 0
            ? prev.filter((p) => klicPolozky(p.slug, p.velikost) !== klic)
            : prev.map((p) => (klicPolozky(p.slug, p.velikost) === klic ? { ...p, pocet } : p)),
        ),
      odebrat: (klic) => setPolozky((prev) => prev.filter((p) => klicPolozky(p.slug, p.velikost) !== klic)),
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
