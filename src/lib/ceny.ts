/**
 * Ceny pravidlem.
 *
 * Obchodník nechce přepisovat 200 cen po jedné. Nastaví jednou větou
 * „kola od Leader Fox prodávám o 5 % levněji a zaokrouhlím na …990"
 * a web to spočítá sám — u stávajících kol i u těch, která přibudou.
 *
 * Cena, kterou obchodník napsal u kola ručně (`cena_rucne`), má vždycky
 * přednost a pravidlo ji nepřepíše.
 */

import { supabase } from "@/integrations/supabase/client";

export type Zaokrouhleni = "990" | "100" | "zadne";

export type CenovePravidlo = {
  /** Komu pravidlo platí — id dodavatele (jako u produktů ve sloupci `dodavatel`). */
  dodavatel: string;
  /** O kolik procent: −5 = o 5 % levněji, 10 = o 10 % dráž. */
  procento: number;
  zaokrouhleni: Zaokrouhleni;
};

export const VYCHOZI_PRAVIDLO: Omit<CenovePravidlo, "dodavatel"> = { procento: 0, zaokrouhleni: "zadne" };

/** Spočítá cenu na webu z ceny dodavatele. */
export function cenaPodlePravidla(cenaDodavatele: number, pravidlo?: Omit<CenovePravidlo, "dodavatel"> | null): number {
  if (!cenaDodavatele || cenaDodavatele <= 0) return 0;
  const p = pravidlo ?? VYCHOZI_PRAVIDLO;
  const c = cenaDodavatele * (1 + p.procento / 100);
  if (p.zaokrouhleni === "990") {
    // Nahoru na nejbližší cenu končící 990: 66 405 → 66 990.
    return Math.max(990, Math.ceil((c - 990) / 1000) * 1000 + 990);
  }
  if (p.zaokrouhleni === "100") return Math.round(c / 100) * 100;
  return Math.round(c);
}

/** Lidsky čitelný popis pravidla. */
export function popisPravidla(p: Omit<CenovePravidlo, "dodavatel">): string {
  const kolik =
    p.procento === 0 ? "za cenu dodavatele" : p.procento < 0 ? `o ${-p.procento} % levněji` : `o ${p.procento} % dráž`;
  const zaokrouhleni =
    p.zaokrouhleni === "990" ? ", zaokrouhleno na …990" : p.zaokrouhleni === "100" ? ", zaokrouhleno na stovky" : "";
  return kolik + zaokrouhleni;
}

export async function nactiPravidla(): Promise<CenovePravidlo[]> {
  const { data, error } = await supabase
    .from("nastaveni")
    .select("hodnota")
    .eq("klic", "cenova-pravidla")
    .maybeSingle();
  if (error) throw error;
  const h = data?.hodnota as { pravidla?: unknown } | null;
  return Array.isArray(h?.pravidla) ? (h!.pravidla as CenovePravidlo[]) : [];
}

export async function ulozPravidla(pravidla: CenovePravidlo[]): Promise<void> {
  const { error } = await supabase
    .from("nastaveni")
    .upsert({ klic: "cenova-pravidla", hodnota: { pravidla } as never }, { onConflict: "klic" });
  if (error) throw error;
}

export const pravidloPro = (pravidla: CenovePravidlo[], dodavatel: string | null | undefined) =>
  dodavatel ? pravidla.find((p) => p.dodavatel === dodavatel) : undefined;

export type ZmenaCeny = { id: string; nazev: string; puvodni: number; nova: number };

/**
 * Přepočítá ceny všech kol od dodavatele podle pravidla. Kola s ruční
 * cenou a kola bez ceny od dodavatele vynechá. Vrací, co se změnilo —
 * podle toho jde změna vrátit.
 */
export async function pouzijPravidlo(pravidlo: CenovePravidlo): Promise<ZmenaCeny[]> {
  const { data, error } = await supabase
    .from("produkty")
    .select("id, nazev, cena, cena_feed, cena_rucne")
    .eq("dodavatel", pravidlo.dodavatel);
  if (error) throw error;
  const zmeny: ZmenaCeny[] = [];
  for (const p of data ?? []) {
    if (p.cena_rucne || !p.cena_feed) continue;
    const nova = cenaPodlePravidla(p.cena_feed, pravidlo);
    if (nova > 0 && nova !== p.cena) zmeny.push({ id: p.id, nazev: p.nazev, puvodni: p.cena, nova });
  }
  for (const z of zmeny) {
    const { error: e } = await supabase.from("produkty").update({ cena: z.nova }).eq("id", z.id);
    if (e) throw e;
  }
  return zmeny;
}

/** Vrátí ceny tak, jak byly před `pouzijPravidlo`. */
export async function vratZmeny(zmeny: ZmenaCeny[]): Promise<void> {
  for (const z of zmeny) {
    const { error } = await supabase.from("produkty").update({ cena: z.puvodni }).eq("id", z.id);
    if (error) throw error;
  }
}
