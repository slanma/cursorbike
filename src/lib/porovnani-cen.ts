/**
 * Porovnání cen se starým webem (PrestaShop).
 *
 * Obchodník vyexportuje produkty ze staré administrace (Katalog → Produkty →
 * Export) a nahraje soubor. Web ke každému kolu ze starého webu najde to
 * samé kolo na novém webu a ukáže, kde se cena liší. Nic nemění samo —
 * cenu převezme až obchodník kliknutím.
 */

import { supabase } from "@/integrations/supabase/client";
import { nactiCursorbikeExport } from "@/lib/feed";
import { cenaProduktu, nazevProWeb } from "@/lib/feed-import";
import { slovaNazvu } from "@/lib/propojeni";

export type RozdilCeny = {
  id: string;
  nazev: string;
  naStaremWebu: number;
  naNovemWebu: number;
};

export type VysledekPorovnani = {
  rozdily: RozdilCeny[];
  sedi: number;
  /** Kola ze starého webu, která jsme na novém nenašli. */
  nenalezena: string[];
};

const shoda = (a: string, b: string) => {
  const x = slovaNazvu(a);
  const y = slovaNazvu(b);
  if (!x.size || !y.size) return 0;
  const spolecne = [...x].filter((s) => y.has(s)).length;
  return (spolecne / x.size + spolecne / y.size) / 2;
};

export async function porovnejCeny(texty: string[]): Promise<VysledekPorovnani> {
  const stare = texty.flatMap((t) => nactiCursorbikeExport(t).produkty);
  const { data, error } = await supabase.from("produkty").select("id, nazev, cena, dodavatel, dodavatel_kod");
  if (error) throw error;
  const nove = data ?? [];

  const pouzita = new Set<string>();
  const vysledek: VysledekPorovnani = { rozdily: [], sedi: 0, nenalezena: [] };

  for (const s of stare) {
    const nazev = nazevProWeb(s);
    // Nejdřív přesně podle kódu (kola, která se zatím nepropojila), pak podle názvu.
    let kolo = nove.find((n) => !pouzita.has(n.id) && n.dodavatel === "cursorbike" && n.dodavatel_kod === s.kod);
    if (!kolo) {
      let nej = 0;
      for (const n of nove) {
        if (pouzita.has(n.id)) continue;
        const sk = shoda(nazev, n.nazev);
        if (sk >= 0.85 && sk > nej) {
          nej = sk;
          kolo = n;
        }
      }
    }
    if (!kolo) {
      vysledek.nenalezena.push(nazev);
      continue;
    }
    pouzita.add(kolo.id);
    const cenaStara = cenaProduktu(s);
    if (cenaStara > 0 && cenaStara !== kolo.cena) {
      vysledek.rozdily.push({ id: kolo.id, nazev: kolo.nazev, naStaremWebu: cenaStara, naNovemWebu: kolo.cena });
    } else {
      vysledek.sedi++;
    }
  }
  return vysledek;
}

/** Převezme cenu ze starého webu. Je to cena od obchodníka, takže ji pravidlo nepřepíše. */
export async function prevezmiCeny(rozdily: RozdilCeny[]): Promise<void> {
  for (const r of rozdily) {
    const { error } = await supabase
      .from("produkty")
      .update({ cena: r.naStaremWebu, cena_rucne: true })
      .eq("id", r.id);
    if (error) throw error;
  }
}
