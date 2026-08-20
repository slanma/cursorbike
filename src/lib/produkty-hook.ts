import { useQuery } from "@tanstack/react-query";
import { nactiDbProdukty, nactiKategorie, nactiNastaveni, naProdukt } from "@/lib/eshop";
import { naUkazku, ukazkoveProdukty, type Produkt } from "@/lib/produkty";

/**
 * Produkty pro veřejné stránky.
 *
 * Základem jsou kola, která obchodník založil v administraci. Ukázková kola
 * z kódu se přidávají jen dokud je v Nastavení zapnuté „zobrazovat ukázková
 * kola“ — až bude e-shop naplněný, vypne se to jedním přepínačem.
 */
export function useVsechnyProdukty(): { produkty: Produkt[]; nacita: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["verejne-produkty"],
    queryFn: async () => {
      const [kategorie, db, nastaveni] = await Promise.all([
        nactiKategorie(),
        nactiDbProdukty(),
        nactiNastaveni(),
      ]);
      return { produkty: db.map((p) => naProdukt(p, kategorie)), nastaveni };
    },
    staleTime: 30_000,
  });

  const zDb = data?.produkty ?? [];

  // Dokud se data načítají, ukázková kola nezobrazujeme — jinak by na webu
  // problikla a pak zmizela.
  if (!data) return { produkty: zDb, nacita: isLoading };

  if (!data.nastaveni.zobrazovat_ukazkove) return { produkty: zDb, nacita: isLoading };

  const slugyDb = new Set(zDb.map((p) => p.slug));
  const ukazky = ukazkoveProdukty.filter((p) => !slugyDb.has(p.slug)).map(naUkazku);
  return { produkty: [...zDb, ...ukazky], nacita: isLoading };
}
