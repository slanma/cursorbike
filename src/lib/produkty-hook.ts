import { useQuery } from "@tanstack/react-query";
import { nactiDbProdukty, nactiKategorie, naProdukt } from "@/lib/eshop";
import { produkty as statickeProdukty, type Produkt } from "@/lib/produkty";

/**
 * Spojí ukázkovou nabídku z kódu s produkty, které obchodník založil v administraci.
 * Produkt z databáze má přednost, pokud má stejný slug.
 */
export function useVsechnyProdukty(): { produkty: Produkt[]; nacita: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["verejne-produkty"],
    queryFn: async () => {
      const [kategorie, db] = await Promise.all([nactiKategorie(), nactiDbProdukty()]);
      return db.map((p) => naProdukt(p, kategorie));
    },
    staleTime: 30_000,
  });

  const zDb = data ?? [];
  const slugyDb = new Set(zDb.map((p) => p.slug));
  return {
    produkty: [...zDb, ...statickeProdukty.filter((p) => !slugyDb.has(p.slug))],
    nacita: isLoading,
  };
}
