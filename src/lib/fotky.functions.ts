import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Stažení fotek k nám.
 *
 * Proč to vůbec je: fotky u naimportovaných kol vedly odkazem na starý web
 * cursorbike.cz. Ten se v září vypne a ve stejnou chvíli by z nového webu
 * zmizely všechny fotky. Odkazovat místo toho na weby dodavatelů je stejná
 * past — jen pomalejší: jakmile Author nebo Crussis fotku přejmenuje nebo
 * smaže, zmizí i nám. A u Authora to ani nejde, jeho feed uvádí jen názvy
 * souborů bez adresy.
 *
 * Jediné spolehlivé řešení je fotku jednou stáhnout a uložit do vlastního
 * úložiště. Musí to běžet na serveru — prohlížeč cizí weby stahovat nesmí
 * (brání tomu bezpečnostní pravidla) a nahrávat do úložiště smí jen
 * servisní klíč.
 */

const POVOLENE_TYPY = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_VELIKOST = 12 * 1024 * 1024;

async function overSpravce(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw error;
  if (!data) throw new Error("Nemáte oprávnění správce.");
}

/** Vrátí true, když už fotka leží v našem úložišti a stahovat se nemusí. */
export const jeNase = (url: string | null | undefined, supabaseUrl: string) =>
  !!url && url.startsWith(`${supabaseUrl}/storage/`);

export const stahniFotky = createServerFn({ method: "POST" })
  .validator((data: { ids: string[] }) => {
    if (!Array.isArray(data?.ids) || !data.ids.length) throw new Error("Nic k stažení.");
    if (data.ids.length > 25) throw new Error("Najednou nejvýš 25 kol.");
    return data;
  })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    await overSpravce(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseUrl = process.env["SUPABASE_URL"] ?? "";

    const { data: produkty, error } = await supabaseAdmin
      .from("produkty")
      .select("id, slug, obrazek_url, obrazky")
      .in("id", data.ids);
    if (error) throw error;

    let stazeno = 0;
    let preskoceno = 0;
    const chyby: string[] = [];

    /**
     * Někteří dodavatelé (Author, Shopify u Lectronu) cizím serverům fotky
     * nevydají. Nejdřív to zkusíme napřímo s hlavičkou Referer, což většinu
     * takových blokád obejde; když ani to neprojde, pošleme to přes veřejnou
     * službu wsrv.nl, která fotku stáhne za nás. Stejný trik se používal
     * i při dřívějším importu do PrestaShopu.
     */
    const pres_proxy = (url: string) =>
      `https://images.weserv.nl/?url=ssl:${url.replace(/^https?:\/\//, "")}`;

    const stahniData = async (url: string) => {
      const puvod = new URL(url).origin;
      let odpoved = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Cursorbike/1.0)",
          Referer: `${puvod}/`,
          Accept: "image/*,*/*",
        },
        redirect: "follow",
      });
      if (!odpoved.ok) odpoved = await fetch(pres_proxy(url), { redirect: "follow" });
      return odpoved;
    };

    const stahni = async (url: string, slug: string, poradi: number): Promise<string> => {
      const odpoved = await stahniData(url);
      if (!odpoved.ok) throw new Error(`fotka nedostupná (${odpoved.status})`);

      const typ = (odpoved.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
      if (!POVOLENE_TYPY.includes(typ)) throw new Error(`nečekaný typ souboru (${typ || "neznámý"})`);

      const data = new Uint8Array(await odpoved.arrayBuffer());
      if (!data.byteLength) throw new Error("prázdný soubor");
      if (data.byteLength > MAX_VELIKOST) throw new Error("fotka je příliš velká");

      const pripona = typ === "image/png" ? "png" : typ === "image/webp" ? "webp" : typ === "image/avif" ? "avif" : "jpg";
      const cesta = `import/${slug}-${poradi}.${pripona}`;
      const { error: chybaUlozeni } = await supabaseAdmin.storage
        .from("produkty")
        .upload(cesta, data, { contentType: typ, upsert: true, cacheControl: "31536000" });
      if (chybaUlozeni) throw chybaUlozeni;

      return supabaseAdmin.storage.from("produkty").getPublicUrl(cesta).data.publicUrl;
    };

    for (const p of produkty ?? []) {
      const galerie = Array.isArray(p.obrazky) ? (p.obrazky as string[]) : [];
      const vsechny = [p.obrazek_url, ...galerie].filter((x): x is string => !!x);

      if (!vsechny.length || vsechny.every((u) => jeNase(u, supabaseUrl))) {
        preskoceno++;
        continue;
      }

      const nove: string[] = [];
      for (let i = 0; i < vsechny.length; i++) {
        const url = vsechny[i]!;
        if (jeNase(url, supabaseUrl)) {
          nove.push(url);
          continue;
        }
        try {
          nove.push(await stahni(url, p.slug, i));
        } catch (e) {
          chyby.push(`${p.slug}: ${e instanceof Error ? e.message : "nepodařilo se"}`);
        }
      }

      if (!nove.length) continue;

      const { error: chybaZapisu } = await supabaseAdmin
        .from("produkty")
        .update({ obrazek_url: nove[0]!, obrazky: nove.slice(1) })
        .eq("id", p.id);
      if (chybaZapisu) {
        chyby.push(`${p.slug}: uložení se nezdařilo`);
        continue;
      }
      stazeno++;
    }

    return { stazeno, preskoceno, chyby: chyby.slice(0, 10), chybCelkem: chyby.length };
  });
