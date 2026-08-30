import { createServerFn } from "@tanstack/react-start";

/**
 * Odesílání e-mailů.
 *
 * Doteď obchodník viděl objednávky, servisní poptávky i zprávy jen tehdy,
 * když se přihlásil do administrace a podíval se tam. Teď mu o každé přijde
 * e-mail.
 *
 * Běží to na serveru, protože klíč k odesílací službě nesmí do prohlížeče.
 * Když klíč není nastavený, nic se neposílá a formulář to nijak nerozbije —
 * záznam je pořád v databázi. Odeslání e-mailu nesmí shodit objednávku.
 */

type Prijemce = { komu: string; predmet: string; telo: string };

const ODESILATEL_ZALOHA = "Cursorbike <onboarding@resend.dev>";

/** Jednoduchá šablona, ať e-maily vypadají stejně a čitelně. */
function stranka(nadpis: string, radky: string[], patka?: string): string {
  const obsah = radky.map((r) => `<p style="margin:0 0 8px">${r}</p>`).join("");
  return `<!doctype html><html lang="cs"><body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;background:#f6f6f4;padding:24px;color:#1a1a1a">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e5e0;border-radius:8px;padding:24px">
<h1 style="margin:0 0 16px;font-size:20px">${nadpis}</h1>
${obsah}
${patka ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid #e5e5e0;font-size:13px;color:#666">${patka}</p>` : ""}
</div></body></html>`;
}

const bezpecne = (t: unknown) =>
  String(t ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const cena = (n: number) =>
  new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(n);

async function posli(zprava: Prijemce, odesilatel: string): Promise<void> {
  const klic = process.env["RESEND_API_KEY"];
  if (!klic) {
    console.warn("[email] RESEND_API_KEY není nastavený, e-mail se neodesílá");
    return;
  }
  const odpoved = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${klic}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: odesilatel || ODESILATEL_ZALOHA,
      to: [zprava.komu],
      subject: zprava.predmet,
      html: zprava.telo,
    }),
  });
  if (!odpoved.ok) {
    console.error("[email] odeslání selhalo:", odpoved.status, await odpoved.text());
  }
}

/** Kam se posílají upozornění a pod jakou adresou odcházejí. */
async function nastaveniEmailu(supabaseAdmin: any) {
  const { data } = await supabaseAdmin.from("nastaveni").select("hodnota").eq("klic", "email").maybeSingle();
  const h = (data?.hodnota ?? {}) as Record<string, unknown>;
  return {
    prijemce: String(h["prijemce"] ?? "cursorbike@seznam.cz"),
    odesilatel: String(h["odesilatel"] ?? ODESILATEL_ZALOHA),
    potvrzeni_zakaznikovi: h["potvrzeni_zakaznikovi"] !== false,
  };
}

/**
 * Upozornění na novou objednávku.
 *
 * Volá se hned po jejím uložení. Případnou chybu jen zaznamenáme — zákazník
 * má objednávku odeslanou a nemá cenu ho strašit tím, že se nepovedl e-mail.
 */
export const posliObjednavku = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => {
    if (!data?.id) throw new Error("Chybí objednávka.");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const nastaveni = await nastaveniEmailu(supabaseAdmin);

      const { data: o } = await supabaseAdmin
        .from("objednavky")
        .select("cislo, jmeno, email, telefon, poznamka, celkem")
        .eq("id", data.id)
        .single();
      if (!o) return { odeslano: false };

      const { data: polozky } = await supabaseAdmin
        .from("objednavka_polozky")
        .select("nazev, cena, pocet, velikost")
        .eq("objednavka_id", data.id);

      const seznam = (polozky ?? [])
        .map(
          (p: any) =>
            `• ${bezpecne(p.nazev)}${p.velikost ? ` — velikost ${bezpecne(p.velikost)}` : ""} × ${p.pocet} — <strong>${cena(p.cena * p.pocet)}</strong>`,
        )
        .join("<br>");

      await posli(
        {
          komu: nastaveni.prijemce,
          predmet: `Nová objednávka č. ${o.cislo} — ${cena(o.celkem)}`,
          telo: stranka(`Nová objednávka č. ${o.cislo}`, [
            `<strong>${bezpecne(o.jmeno)}</strong>`,
            `${bezpecne(o.email)}${o.telefon ? ` · ${bezpecne(o.telefon)}` : ""}`,
            seznam,
            `Celkem: <strong>${cena(o.celkem)}</strong>`,
            ...(o.poznamka ? [`Poznámka: ${bezpecne(o.poznamka)}`] : []),
          ]),
        },
        nastaveni.odesilatel,
      );

      if (nastaveni.potvrzeni_zakaznikovi && o.email) {
        await posli(
          {
            komu: o.email,
            predmet: `Vaše objednávka č. ${o.cislo} u Cursorbike`,
            telo: stranka(
              "Děkujeme za objednávku",
              [
                `Dobrý den ${bezpecne(o.jmeno)},`,
                `přijali jsme vaši objednávku č. <strong>${o.cislo}</strong>.`,
                seznam,
                `Celkem: <strong>${cena(o.celkem)}</strong>`,
                "Ozveme se vám s potvrzením dostupnosti. Kolo si vyzvednete na prodejně v Kravařích, kde vám ho seřídíme a nastavíme posed.",
              ],
              "Cursorbike · Novodvorská 310/13, 747 21 Kravaře · +420 606 713 763",
            ),
          },
          nastaveni.odesilatel,
        );
      }
      return { odeslano: true };
    } catch (e) {
      console.error("[email] objednávka:", e);
      return { odeslano: false };
    }
  });

/** Upozornění na servisní poptávku nebo zprávu z kontaktního formuláře. */
export const posliPoptavku = createServerFn({ method: "POST" })
  .validator((data: { id: string; druh: "servis" | "zprava" }) => {
    if (!data?.id || !["servis", "zprava"].includes(data.druh)) throw new Error("Neplatný požadavek.");
    return data;
  })
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const nastaveni = await nastaveniEmailu(supabaseAdmin);

      if (data.druh === "servis") {
        const { data: s } = await supabaseAdmin
          .from("servis_poptavky")
          .select("jmeno, email, telefon, typ_sluzby, popis, termin")
          .eq("id", data.id)
          .single();
        if (!s) return { odeslano: false };
        await posli(
          {
            komu: nastaveni.prijemce,
            predmet: `Servisní poptávka — ${s.jmeno}`,
            telo: stranka("Nová servisní poptávka", [
              `<strong>${bezpecne(s.jmeno)}</strong>`,
              `${bezpecne(s.email)}${s.telefon ? ` · ${bezpecne(s.telefon)}` : ""}`,
              ...(s.typ_sluzby ? [`Služba: ${bezpecne(s.typ_sluzby)}`] : []),
              ...(s.termin ? [`Termín: ${bezpecne(s.termin)}`] : []),
              ...(s.popis ? [bezpecne(s.popis)] : []),
            ]),
          },
          nastaveni.odesilatel,
        );
      } else {
        const { data: z } = await supabaseAdmin
          .from("zpravy")
          .select("jmeno, email, telefon, zprava")
          .eq("id", data.id)
          .single();
        if (!z) return { odeslano: false };
        await posli(
          {
            komu: nastaveni.prijemce,
            predmet: `Zpráva z webu — ${z.jmeno}`,
            telo: stranka("Nová zpráva z webu", [
              `<strong>${bezpecne(z.jmeno)}</strong>`,
              `${bezpecne(z.email)}${z.telefon ? ` · ${bezpecne(z.telefon)}` : ""}`,
              bezpecne(z.zprava),
            ]),
          },
          nastaveni.odesilatel,
        );
      }
      return { odeslano: true };
    } catch (e) {
      console.error("[email] poptávka:", e);
      return { odeslano: false };
    }
  });
