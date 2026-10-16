import { supabase } from "@/integrations/supabase/client";
import placeholder from "@/assets/kolo-trekking.jpg";
import type { Kategorie, ParametrSkupina, Produkt } from "@/lib/produkty";

export type DbZnacka = {
  id: string;
  sekce: string;
  slug: string;
  nazev: string;
  popis: string;
  poradi: number;
  aktivni: boolean;
};

export type DbKategorie = {
  id: string;
  slug: string;
  nazev: string;
  sekce: string;
  znacka: string | null;
  znacka_id: string | null;
  popis: string;
  poradi: number;
};

export type DbProdukt = {
  id: string;
  slug: string;
  nazev: string;
  kategorie_id: string | null;
  cena: number;
  puvodni_cena: number | null;
  kratky: string;
  popis: string;
  obrazek_url: string | null;
  oblibene: boolean;
  aktivni: boolean;
  pro_koho: string[];
  neni_pro_koho: string | null;
  parametry: ParametrSkupina[];
  velikosti: string[];
  skladem: number;
  na_objednavku: boolean;
  obrazky: string[];
  ean: string | null;
  cena_feed: number | null;
  dodavatel: string | null;
  dodavatel_kod: string | null;
  barva: string | null;
  importovano_at: string | null;
  created_at: string;
};

/** Nastavení e-shopu (tabulka `nastaveni`, řádek s klíčem `eshop`). */
export type NastaveniEshopu = {
  zobrazovat_ukazkove: boolean;
};

export const VYCHOZI_NASTAVENI: NastaveniEshopu = {
  zobrazovat_ukazkove: true,
};

export type DbObjednavka = {
  id: string;
  jmeno: string;
  email: string;
  telefon: string | null;
  poznamka: string | null;
  cislo: number;
  celkem: number;
  stav: string;
  created_at: string;
};

export type DbObjednavkaPolozka = {
  id: string;
  objednavka_id: string;
  nazev: string;
  slug: string | null;
  cena: number;
  pocet: number;
  velikost: string | null;
};

export type DbPoptavka = {
  id: string;
  jmeno: string;
  email: string;
  telefon: string | null;
  typ_sluzby: string | null;
  popis: string | null;
  termin: string | null;
  stav: string;
  created_at: string;
};

export type DbZprava = {
  id: string;
  jmeno: string;
  email: string;
  telefon: string | null;
  zprava: string;
  stav: string;
  created_at: string;
};

export const STAVY_ZPRAVY = ["nova", "vyrizuje-se", "hotovo"] as const;

export const STAVY_OBJEDNAVKY = ["nova", "vyrizuje-se", "pripravena", "dokoncena", "zrusena"] as const;
export const STAVY_POPTAVKY = ["nova", "domluveno", "hotovo", "zrusena"] as const;

export const stavLabel: Record<string, string> = {
  nova: "Nová",
  "vyrizuje-se": "Vyřizuje se",
  pripravena: "Připravená k převzetí",
  dokoncena: "Dokončená",
  zrusena: "Zrušená",
  domluveno: "Domluven termín",
  hotovo: "Hotovo",
};

/** Načte zprávy z kontaktního formuláře (jen pro administraci). */
export async function nactiZpravy(): Promise<DbZprava[]> {
  const { data, error } = await supabase
    .from("zpravy")
    .select("id, jmeno, email, telefon, zprava, stav, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbZprava[];
}

/** Načte kategorie (veřejné). */
export async function nactiKategorie(): Promise<DbKategorie[]> {
  const { data, error } = await supabase
    .from("kategorie")
    .select("id, slug, nazev, sekce, znacka, znacka_id, popis, poradi")
    .order("poradi", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbKategorie[];
}

/** Načte značky (veřejné). */
export async function nactiZnacky(): Promise<DbZnacka[]> {
  const { data, error } = await supabase
    .from("znacky")
    .select("id, sekce, slug, nazev, popis, poradi, aktivni")
    .order("poradi", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbZnacka[];
}

/** Načte nastavení e-shopu. Chybějící řádek není chyba — vrátíme výchozí hodnoty. */
export async function nactiNastaveni(): Promise<NastaveniEshopu> {
  const { data, error } = await supabase
    .from("nastaveni")
    .select("hodnota")
    .eq("klic", "eshop")
    .maybeSingle();
  if (error) throw error;
  return { ...VYCHOZI_NASTAVENI, ...((data?.hodnota ?? {}) as Partial<NastaveniEshopu>) };
}

/** Načte údaje pro platbu (číslo účtu atd.). */
export async function nactiPlatbu(): Promise<import("@/lib/platba").UdajePlatby> {
  const { VYCHOZI_PLATBA } = await import("@/lib/platba");
  const { data, error } = await supabase
    .from("nastaveni")
    .select("hodnota")
    .eq("klic", "platba")
    .maybeSingle();
  if (error) throw error;
  return { ...VYCHOZI_PLATBA, ...((data?.hodnota ?? {}) as object) };
}

/** Uloží údaje pro platbu (jen administrace). */
export async function ulozPlatbu(hodnota: import("@/lib/platba").UdajePlatby): Promise<void> {
  const { error } = await supabase
    .from("nastaveni")
    .upsert({ klic: "platba", hodnota }, { onConflict: "klic" });
  if (error) throw error;
}

export type PravniUdaje = {
  jednatel: string;
  datova_schranka: string;
  /** Datum účinnosti obchodních podmínek, např. „1. 9. 2026". */
  ucinnost_od: string;
};

export const VYCHOZI_PRAVNI: PravniUdaje = { jednatel: "", datova_schranka: "", ucinnost_od: "" };

/** Načte právní údaje doplněné obchodníkem. */
export async function nactiPravni(): Promise<PravniUdaje> {
  const { data, error } = await supabase
    .from("nastaveni")
    .select("hodnota")
    .eq("klic", "pravni")
    .maybeSingle();
  if (error) throw error;
  return { ...VYCHOZI_PRAVNI, ...((data?.hodnota ?? {}) as Partial<PravniUdaje>) };
}

/** Uloží právní údaje (jen administrace). */
export async function ulozPravni(hodnota: PravniUdaje): Promise<void> {
  const { error } = await supabase
    .from("nastaveni")
    .upsert({ klic: "pravni", hodnota }, { onConflict: "klic" });
  if (error) throw error;
}

export type NastaveniEmailu = {
  prijemce: string;
  odesilatel: string;
  potvrzeni_zakaznikovi: boolean;
};

export const VYCHOZI_EMAIL: NastaveniEmailu = {
  prijemce: "cursorbike@seznam.cz",
  odesilatel: "Cursorbike <onboarding@resend.dev>",
  potvrzeni_zakaznikovi: true,
};

/** Načte nastavení e-mailů. */
export async function nactiEmail(): Promise<NastaveniEmailu> {
  const { data, error } = await supabase
    .from("nastaveni")
    .select("hodnota")
    .eq("klic", "email")
    .maybeSingle();
  if (error) throw error;
  return { ...VYCHOZI_EMAIL, ...((data?.hodnota ?? {}) as Partial<NastaveniEmailu>) };
}

/** Uloží nastavení e-mailů (jen administrace). */
export async function ulozEmail(hodnota: NastaveniEmailu): Promise<void> {
  const { error } = await supabase
    .from("nastaveni")
    .upsert({ klic: "email", hodnota }, { onConflict: "klic" });
  if (error) throw error;
}

/** Načte uložené přiřazení kategorií z feedu na naše kategorie. */
export async function nactiMapovani(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("nastaveni")
    .select("hodnota")
    .eq("klic", "import-mapovani")
    .maybeSingle();
  if (error) throw error;
  return (data?.hodnota ?? {}) as Record<string, string>;
}

/** Uloží přiřazení kategorií, ať se neodklikává při každém importu znovu. */
export async function ulozMapovani(mapovani: Record<string, string>): Promise<void> {
  const { error } = await supabase
    .from("nastaveni")
    .upsert({ klic: "import-mapovani", hodnota: mapovani }, { onConflict: "klic" });
  if (error) throw error;
}

/** Profily dodavatelů pro univerzální import (jak číst jejich feed). */
export async function nactiProfily(): Promise<import("@/lib/feed-univerzalni").ProfilDodavatele[]> {
  const { data, error } = await supabase
    .from("nastaveni")
    .select("hodnota")
    .eq("klic", "feed-profily")
    .maybeSingle();
  if (error) throw error;
  const h = data?.hodnota as { profily?: unknown } | null;
  return Array.isArray(h?.profily) ? (h!.profily as import("@/lib/feed-univerzalni").ProfilDodavatele[]) : [];
}

export async function ulozProfily(profily: import("@/lib/feed-univerzalni").ProfilDodavatele[]): Promise<void> {
  const { error } = await supabase
    .from("nastaveni")
    .upsert({ klic: "feed-profily", hodnota: { profily } as never }, { onConflict: "klic" });
  if (error) throw error;
}

/** Uloží nastavení e-shopu (jen administrace). */
export async function ulozNastaveni(hodnota: NastaveniEshopu): Promise<void> {
  const { error } = await supabase
    .from("nastaveni")
    .upsert({ klic: "eshop", hodnota }, { onConflict: "klic" });
  if (error) throw error;
}

/** Načte produkty z databáze. `vseVcetneSkrytych` používá jen administrace. */
export async function nactiDbProdukty(vseVcetneSkrytych = false): Promise<DbProdukt[]> {
  let q = supabase.from("produkty").select("*").order("created_at", { ascending: false });
  if (!vseVcetneSkrytych) q = q.eq("aktivni", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as DbProdukt[];
}

/** Převede databázový produkt na tvar, který používají veřejné stránky. */
export function naProdukt(db: DbProdukt, kategorie: DbKategorie[]): Produkt {
  const k = kategorie.find((x) => x.id === db.kategorie_id);
  const sekce: Kategorie =
    k?.sekce === "elektrokola" ? "elektrokola" : k?.sekce === "bazar" ? "bazar" : "kola";
  return {
    slug: db.slug,
    nazev: db.nazev,
    kategorie: sekce,
    typ: k?.nazev ?? "Kolo",
    znacka: k?.znacka ?? "",
    // Pozn.: `podkategorie` nese slug kategorie z databáze. Dřív se z něj
    // odřezávala předpona, což se rozcházelo s tím, co ukládala administrace.
    podkategorie: k?.slug ?? "",
    velikosti: db.velikosti ?? [],
    skladem: db.skladem ?? 0,
    naObjednavku: db.na_objednavku ?? true,
    obrazky: Array.isArray(db.obrazky) ? db.obrazky : [],
    cena: db.cena,
    ...(db.puvodni_cena ? { puvodniCena: db.puvodni_cena } : {}),
    oblibene: db.oblibene,
    obrazek: db.obrazek_url || placeholder,
    kratky: db.kratky,
    popis: db.popis,
    proKoho: db.pro_koho ?? [],
    ...(db.neni_pro_koho ? { neniProKoho: db.neni_pro_koho } : {}),
    parametry: Array.isArray(db.parametry) ? db.parametry : [],
  };
}

/**
 * Nahraje fotku produktu a vrátí trvale platnou veřejnou adresu.
 * Bucket „produkty" je veřejný (viz migrace 20260814090000), takže nepotřebujeme
 * podepsané URL s expirací — veřejná URL se navíc dá cachovat na CDN.
 */
export async function nahrajFotku(file: File): Promise<string> {
  const pripona = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const cesta = `${crypto.randomUUID()}.${pripona}`;
  const { error } = await supabase.storage
    .from("produkty")
    .upload(cesta, file, { upsert: false, contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;
  const { data } = supabase.storage.from("produkty").getPublicUrl(cesta);
  return data.publicUrl;
}
