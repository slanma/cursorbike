import { useQuery } from "@tanstack/react-query";
import { nactiKategorie, nactiZnacky, type DbKategorie, type DbZnacka } from "@/lib/eshop";
import type { Kategorie, Znacka } from "@/lib/produkty";

/**
 * Katalog značek a jejich kategorií — nově z databáze, ne z kódu.
 *
 * Dřív byl seznam značek napevno v src/lib/produkty.ts, takže cokoli
 * obchodník založil v /admin/kategorie, se na web nedostalo.
 */
export function sestavZnacky(znacky: DbZnacka[], kategorie: DbKategorie[], sekce: Kategorie): Znacka[] {
  return znacky
    .filter((z) => z.sekce === sekce && z.aktivni)
    .sort((a, b) => a.poradi - b.poradi || a.nazev.localeCompare(b.nazev, "cs"))
    .map((z) => ({
      slug: z.slug,
      nazev: z.nazev,
      popis: z.popis,
      podkategorie: kategorie
        .filter((k) => (k.znacka_id ? k.znacka_id === z.id : k.sekce === z.sekce && k.znacka === z.slug))
        .sort((a, b) => a.poradi - b.poradi || a.nazev.localeCompare(b.nazev, "cs"))
        .map((k) => ({ slug: k.slug, nazev: k.nazev })),
    }));
}

export function useKatalog(sekce: Kategorie): { znacky: Znacka[]; nacita: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["katalog"],
    queryFn: async () => {
      const [znacky, kategorie] = await Promise.all([nactiZnacky(), nactiKategorie()]);
      return { znacky, kategorie };
    },
    staleTime: 60_000,
  });

  return {
    znacky: data ? sestavZnacky(data.znacky, data.kategorie, sekce) : [],
    nacita: isLoading,
  };
}

/** Jedna značka podle slugu, nebo `null` když neexistuje. */
export function useZnacka(sekce: Kategorie, slug: string): { znacka: Znacka | null; nacita: boolean } {
  const { znacky, nacita } = useKatalog(sekce);
  return { znacka: znacky.find((z) => z.slug === slug) ?? null, nacita };
}
