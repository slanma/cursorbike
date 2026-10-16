import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Největší feed, který stáhneme (bez komprese). */
const MAX_BAJTU = 60 * 1024 * 1024;

/**
 * Stáhne feed z odkazu dodavatele.
 *
 * Prohlížeč to sám nezvládne — servery dodavatelů cizímu webu stahování
 * většinou nepovolí. Proto feed stáhne server a pošle ho do administrace
 * zabalený (gzip), aby se vešel i velký soubor. Rozbalí a přečte se až
 * v prohlížeči, kde se pozná i kódování.
 *
 * Smí jen správce, jinak by si přes nás mohl kdokoli stahovat cizí stránky.
 */
export const stahniFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string }) => ({ url: String(input.url ?? "").trim() }))
  .handler(async ({ data, context }) => {
    const { data: jeSpravce, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw error;
    if (!jeSpravce) throw new Error("Nemáte oprávnění správce.");

    let adresa: URL;
    try {
      adresa = new URL(data.url);
    } catch {
      throw new Error("Tohle nevypadá jako odkaz. Zkopírujte celou adresu i s https://");
    }
    if (adresa.protocol !== "https:" && adresa.protocol !== "http:") {
      throw new Error("Odkaz musí začínat https:// nebo http://");
    }

    const ovladac = new AbortController();
    const casovac = setTimeout(() => ovladac.abort(), 55_000);
    let odpoved: Response;
    try {
      odpoved = await fetch(adresa, {
        signal: ovladac.signal,
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CursorbikeFeed/1.0)", Accept: "*/*" },
      });
    } catch {
      throw new Error("Feed se nepodařilo stáhnout — server dodavatele neodpověděl.");
    } finally {
      clearTimeout(casovac);
    }
    if (!odpoved.ok) {
      throw new Error(`Server dodavatele vrátil chybu ${odpoved.status}. Zkontrolujte odkaz.`);
    }

    const bajty = new Uint8Array(await odpoved.arrayBuffer());
    if (bajty.byteLength > MAX_BAJTU) {
      throw new Error("Feed je příliš velký (víc než 60 MB). Požádejte dodavatele o menší.");
    }

    const { gzipSync } = await import("node:zlib");
    return {
      gzipBase64: gzipSync(bajty).toString("base64"),
      velikost: bajty.byteLength,
    };
  });

/** V prohlížeči: rozbalí to, co poslal server. */
export async function rozbalStazeny(gzipBase64: string): Promise<Uint8Array> {
  const binar = atob(gzipBase64);
  const zabaleno = new Uint8Array(binar.length);
  for (let i = 0; i < binar.length; i++) zabaleno[i] = binar.charCodeAt(i);
  const proud = new Blob([zabaleno]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(proud).arrayBuffer());
}
