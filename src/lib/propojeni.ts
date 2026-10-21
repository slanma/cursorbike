/**
 * Propojení kol ze starého webu s dodavatelem.
 *
 * Kola převzatá ze starého Cursorbiku nemají dodavatele, takže je nikdo
 * nehlídá. Když pak přijde feed od dodavatele se stejným kolem, nesmí
 * vzniknout dvakrát. Místo nového produktu se staré kolo jen „propojí":
 * zůstane mu název, fotky, popis i cena od obchodníka, a od teď se u něj
 * hlídá sklad, velikosti a jestli ho dodavatel ještě má.
 */

import { supabase } from "@/integrations/supabase/client";
import type { FeedProdukt } from "@/lib/feed";
import type { ExistujiciProdukt, Plan } from "@/lib/feed-import";

const BEZ_DODAVATELE = new Set(["cursorbike", ""]);

export const slovaNazvu = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9,]+/g, " ")
      .split(" ")
      // Ročník (2026, 2025-26) se mezi starým a novým webem liší, nic neříká.
      .filter((x) => x.length >= 3 && !/^20\d\d/.test(x) && !["bike", "kolo", "elektrokolo"].includes(x)),
  );

/** Jak moc se nový produkt podobá starému (0 až 1). Značka musí sedět vždy. */
function podobnost(novy: FeedProdukt, staryNazev: string): number {
  const nove = slovaNazvu(`${novy.nazev} ${novy.barva ?? ""}`);
  const stare = slovaNazvu(staryNazev);
  if (nove.size < 2) return 0;
  const znacka = slovaNazvu(novy.znacka ?? novy.nazev.split(" ")[0] ?? "");
  if ([...znacka].some((z) => !stare.has(z))) return 0;
  const shoda = [...nove].filter((s) => stare.has(s)).length;
  const zNoveho = shoda / nove.size;
  if (zNoveho < 0.8) return 0;
  // Ze dvou podobných (třeba dvě barvy stejného modelu) vyhraje to, které sedí i obráceně.
  return (zNoveho + shoda / Math.max(1, stare.size)) / 2;
}

export type Par = { id: string; stary: string; novy: string };

/** Najde ke každému novému produktu staré kolo bez dodavatele, pokud je skoro stejné. */
export function najdiStareKolo(
  produkt: FeedProdukt,
  existujici: ExistujiciProdukt[],
  pouzita = new Set<string>(),
): ExistujiciProdukt | undefined {
  let nej: ExistujiciProdukt | undefined;
  let skore = 0;
  for (const e of existujici) {
    if (pouzita.has(e.id) || !BEZ_DODAVATELE.has(e.dodavatel ?? "")) continue;
    const s = podobnost(produkt, e.nazev);
    if (s > 0 && s > skore) {
      nej = e;
      skore = s;
    }
  }
  return nej;
}

/**
 * Projde plán importu: nové produkty, které už na webu jsou ze starého webu,
 * nezaloží znovu, ale propojí. Vrací upravený plán a seznam propojených.
 */
export async function propojSeStarymi(
  plan: Plan,
  existujici: ExistujiciProdukt[],
): Promise<{ plan: Plan; pary: Par[] }> {
  const pouzita = new Set<string>();
  const pary: Par[] = [];
  const radky = [];
  for (const r of plan.radky) {
    if (r.akce !== "novy") {
      radky.push(r);
      continue;
    }
    const stare = najdiStareKolo(r.produkt, existujici, pouzita);
    if (!stare) {
      radky.push(r);
      continue;
    }
    pouzita.add(stare.id);
    const { error } = await supabase
      .from("produkty")
      .update({ dodavatel: r.produkt.dodavatel, dodavatel_kod: r.produkt.kod })
      .eq("id", stare.id);
    if (error) throw error;
    pary.push({ id: stare.id, stary: stare.nazev, novy: r.produkt.nazev });
    // Dál se s ním zachází jako s aktualizací: doplní se sklad, velikosti a EAN,
    // název, fotky, popis a cena zůstanou.
    radky.push({ ...r, akce: "aktualizace" as const, id: stare.id });
  }
  return {
    plan: {
      ...plan,
      radky,
      novych: radky.filter((r) => r.akce === "novy").length,
      aktualizaci: radky.filter((r) => r.akce === "aktualizace").length,
    },
    pary,
  };
}
