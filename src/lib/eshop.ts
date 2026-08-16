import { supabase } from "@/integrations/supabase/client";
import placeholder from "@/assets/kolo-trekking.jpg";
import type { Kategorie, ParametrSkupina, Produkt } from "@/lib/produkty";

export type DbKategorie = {
  id: string;
  slug: string;
  nazev: string;
  sekce: string;
  znacka: string | null;
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
  created_at: string;
};

export type DbObjednavka = {
  id: string;
  jmeno: string;
  email: string;
  telefon: string | null;
  poznamka: string | null;
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
    .select("id, slug, nazev, sekce, znacka, poradi")
    .order("poradi", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbKategorie[];
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
  return {
    slug: db.slug,
    nazev: db.nazev,
    kategorie: (k?.sekce === "elektrokola" ? "elektrokola" : "kola") as Kategorie,
    typ: k?.nazev ?? "Kolo",
    znacka: k?.znacka ?? "",
    podkategorie: k ? k.slug.replace(`${k.sekce}-${k.znacka ?? ""}-`, "") : "",
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
