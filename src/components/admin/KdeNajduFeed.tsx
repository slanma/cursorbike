import { useState } from "react";
import { toast } from "sonner";
import { Copy, HelpCircle } from "lucide-react";

/**
 * Berlička pro obchodníka: kde u dodavatele najít odkaz na feed.
 *
 * Každý dodavatel to má schované jinde a jinak pojmenované (XML, feed,
 * export, datový export…). Pro známé dodavatele je tu přesný postup,
 * pro ostatní obecné rady a hotový e-mail, kterým si o odkaz řeknete.
 */

type Navod = { dodavatel: string; poznamka?: string; kroky: string[]; odkaz?: string };

const NAVODY: Navod[] = [
  {
    dodavatel: "Author (Universe Agency, uniag.biz)",
    poznamka: "Author dovoluje stahovat nejvýš 2× denně. Měsíční přehled to bohatě splňuje.",
    kroky: [
      "Přihlaste se na www.uniag.biz svým prodejním účtem.",
      "Nahoře klikněte na INFO, pak na Nastavení a pak na XMLdata.",
      "Když u „Heslo pro stažení XML“ není nic vyplněné, klikněte na Jiné heslo a nějaké si nastavte.",
      "Najděte řádek „Váš osobní XML3 odkaz — AUTOMATICKÉ STAŽENÍ“ (oranžový odkaz začínající http://www.uniag.biz/xml3dej.php…).",
      "Celý ten odkaz zkopírujte a vložte sem do políčka Odkaz na feed. Ten s koncem &ZOBRAZ=1 nepoužívejte.",
    ],
  },
  {
    dodavatel: "Crussis",
    kroky: [
      "Tenhle odkaz jsme už pro Cursorbike používali. Zkopírujte ho a vložte sem.",
      "Kdyby nefungoval, vyžádejte si aktuální odkaz u Crussisu — hotový e-mail je níž.",
    ],
    odkaz: "https://www.crussis.cz/eshop-export-distributori.xml",
  },
  {
    dodavatel: "Leader Fox",
    kroky: [
      "Odkaz si vyžádejte u Leader Foxu — hotový e-mail je níž.",
      "Cursorbike už svůj odkaz má: https://e-shop.leaderfox.cz/bikecentrum.xml",
    ],
  },
];

const OBECNE = [
  "Přihlaste se do prodejního (B2B) portálu dodavatele.",
  "Hledejte slova: XML, feed, export, datový export, pro e-shopy, ke stažení. Bývají v Nastavení, v Můj účet nebo dole v patičce.",
  "Odkaz obvykle končí na .xml nebo .csv, případně obsahuje slovo xml nebo feed.",
  "Když nic nenajdete, napište dodavateli. Hotový e-mail je níž.",
];

const EMAIL = `Dobrý den,

jsme Váš prodejce a rádi bychom měli Vaši nabídku na našem e-shopu vždy aktuální.

Můžete nám prosím poslat odkaz na XML nebo CSV feed s Vaším zbožím? Ideálně s názvy, cenami, fotkami, EAN a skladovostí.

Děkujeme a přejeme hezký den`;

async function zkopiruj(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Zkopírováno. Teď to vložte (Cmd + V).");
  } catch {
    toast.error("Kopírování se nepovedlo. Označte text myší a zkopírujte ho ručně.");
  }
}

export function KdeNajduFeed() {
  const [otevreno, setOtevreno] = useState(false);
  return (
    <div className="rounded-lg bg-amber-50 text-amber-950">
      <button
        type="button"
        onClick={() => setOtevreno(!otevreno)}
        aria-expanded={otevreno}
        className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-lg font-bold"
      >
        <HelpCircle className="h-6 w-6 shrink-0" />
        Kde najdu odkaz na feed?
        <span className="ml-auto" aria-hidden="true">
          {otevreno ? "▴" : "▾"}
        </span>
      </button>
      {otevreno && (
        <div className="grid gap-5 px-4 pb-5 text-base">
          <p>
            Feed je soubor, ve kterém má dodavatel celou svou nabídku — názvy, ceny, fotky. Web si z něj kola sám
            načte. Potřebujete od dodavatele jen <b>odkaz</b> na ten soubor.
          </p>

          {NAVODY.map((n) => (
            <details key={n.dodavatel} className="rounded-md bg-card text-foreground">
              <summary className="flex min-h-12 cursor-pointer items-center px-4 font-bold">{n.dodavatel}</summary>
              <div className="grid gap-3 px-4 pb-4">
                <ol className="grid gap-2">
                  {n.kroky.map((k, i) => (
                    <li key={k} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <span>{k}</span>
                    </li>
                  ))}
                </ol>
                {n.odkaz && (
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-surface px-2 py-1 text-sm">{n.odkaz}</code>
                    <button
                      type="button"
                      onClick={() => void zkopiruj(n.odkaz!)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-md border-2 px-3 font-semibold hover:border-primary"
                    >
                      <Copy className="h-4 w-4" /> Zkopírovat odkaz
                    </button>
                  </div>
                )}
                {n.poznamka && <p className="text-muted-foreground">{n.poznamka}</p>}
              </div>
            </details>
          ))}

          <details className="rounded-md bg-card text-foreground">
            <summary className="flex min-h-12 cursor-pointer items-center px-4 font-bold">Jiný dodavatel</summary>
            <ol className="grid gap-2 px-4 pb-4">
              {OBECNE.map((k, i) => (
                <li key={k} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span>{k}</span>
                </li>
              ))}
            </ol>
          </details>

          <details className="rounded-md bg-card text-foreground">
            <summary className="flex min-h-12 cursor-pointer items-center px-4 font-bold">
              Hotový e-mail pro dodavatele
            </summary>
            <div className="grid gap-3 px-4 pb-4">
              <pre className="whitespace-pre-wrap rounded bg-surface p-3 font-sans text-base">{EMAIL}</pre>
              <div>
                <button
                  type="button"
                  onClick={() => void zkopiruj(EMAIL)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border-2 px-3 font-semibold hover:border-primary"
                >
                  <Copy className="h-4 w-4" /> Zkopírovat e-mail
                </button>
              </div>
            </div>
          </details>

          <p className="font-semibold">
            Odkaz často obsahuje vaše heslo k dodavateli. Neposílejte ho nikomu cizímu. U nás ho vidí jen správci.
          </p>
        </div>
      )}
    </div>
  );
}
