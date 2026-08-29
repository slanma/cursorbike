import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { nactiKategorie, nactiMapovani, ulozMapovani } from "@/lib/eshop";
import { nactiFeed, shrnUpozorneni, type FeedVysledek } from "@/lib/feed";
import {
  navrhniMapovani,
  nactiProPorovnani,
  nazevProWeb,
  provedImport,
  sestavPlan,
  type ExistujiciProdukt,
  type Mapovani,
  type Plan,
} from "@/lib/feed-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/feedy")({
  component: ImportFeedu,
});

type NaseKategorie = { id: string; nazev: string; sekce: string; znacka: string | null };

/**
 * Feed od Authora je v kódování Windows-1250, ne v UTF-8. Kdybychom ho
 * přečetli jako UTF-8, rozsypala by se všechna diakritika.
 */
async function precti(soubor: File): Promise<string> {
  const buffer = await soubor.arrayBuffer();
  const zacatek = new TextDecoder("utf-8").decode(buffer.slice(0, 200));
  const kodovani = /encoding=["']?windows-1250/i.test(zacatek) ? "windows-1250" : "utf-8";
  return new TextDecoder(kodovani).decode(buffer);
}

const popisSekce = (s: string) =>
  s === "elektrokola" ? "Elektrokola" : s === "bazar" ? "Bazar" : "Kola";

/**
 * Import od dodavatelů.
 *
 * Záměrně jedna obrazovka a co nejmíň rozhodování: vyberete soubor a hned
 * vidíte, co se stane a kolik kol přibude. Zařazení do kategorií si program
 * spočítá sám a ukazuje ho jen tehdy, když si s něčím neporadil — jinak by
 * obsluha proklikávala dvacet roletek pokaždé znovu.
 */
function ImportFeedu() {
  const qc = useQueryClient();
  const [feed, setFeed] = useState<FeedVysledek | null>(null);
  const [nase, setNase] = useState<NaseKategorie[]>([]);
  const [mapovani, setMapovani] = useState<Mapovani>({});
  const [existujici, setExistujici] = useState<ExistujiciProdukt[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [prubeh, setPrubeh] = useState<string | null>(null);
  const [hotovo, setHotovo] = useState<{ novych: number; aktualizovano: number } | null>(null);
  const [rozbaleno, setRozbaleno] = useState(false);

  const kategorieFeedu = feed
    ? [...new Set(feed.produkty.map((p) => p.kategorieFeed))]
        .map((k) => ({ nazev: k, pocet: feed.produkty.filter((p) => p.kategorieFeed === k).length }))
        .sort((a, b) => Number(!!mapovani[a.nazev]) - Number(!!mapovani[b.nazev]) || b.pocet - a.pocet)
    : [];
  const nezarazene = kategorieFeedu.filter((k) => !mapovani[k.nazev]);

  const prepocitej = (m: Mapovani, f = feed, e = existujici) => {
    if (f) setPlan(sestavPlan(f, e, m));
  };

  const nactiSoubory = async (soubory: File[]) => {
    setFeed(null);
    setPlan(null);
    setHotovo(null);
    setRozbaleno(false);
    setPrubeh(soubory.length > 1 ? `Čtu ${soubory.length} souborů…` : "Čtu soubor…");
    try {
      const casti = await Promise.all(soubory.map(async (f) => nactiFeed(f.name, await precti(f))));
      const videno = new Set<string>();
      const vysledek: FeedVysledek = {
        dodavatel: casti[0]!.dodavatel,
        produkty: casti
          .flatMap((c) => c.produkty)
          .filter((p) => {
            const klic = `${p.dodavatel}|${p.kod}`;
            if (videno.has(klic)) return false;
            videno.add(klic);
            return true;
          }),
        upozorneni: casti.flatMap((c) => c.upozorneni),
        polozekVeFeedu: casti.reduce((s, c) => s + c.polozekVeFeedu, 0),
      };

      const [ulozene, produkty, kategorie] = await Promise.all([
        nactiMapovani(),
        nactiProPorovnani(),
        nactiKategorie(),
      ]);
      const seznamKategorii: NaseKategorie[] = kategorie.map((k) => ({
        id: k.id,
        nazev: k.nazev,
        sekce: k.sekce,
        znacka: k.znacka,
      }));

      // Zařazení se spočítá samo; ručně uložené má přednost.
      const navrh = navrhniMapovani(
        [...new Set(vysledek.produkty.map((p) => p.kategorieFeed))],
        seznamKategorii,
      );
      const vysledneMapovani = { ...navrh, ...(ulozene ?? {}) };

      setFeed(vysledek);
      setNase(seznamKategorii);
      setExistujici(produkty);
      setMapovani(vysledneMapovani);
      // Náhled rovnou, ať se na něj nemusí klikat zvlášť.
      setPlan(sestavPlan(vysledek, produkty, vysledneMapovani));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Soubor se nepodařilo přečíst");
    } finally {
      setPrubeh(null);
    }
  };

  const spustit = async () => {
    if (!plan) return;
    setPrubeh("Spouštím import…");
    try {
      await ulozMapovani(mapovani);
      const v = await provedImport(plan, existujici, setPrubeh);
      setHotovo(v);
      setFeed(null);
      setPlan(null);
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
      qc.invalidateQueries({ queryKey: ["verejne-produkty"] });
      qc.invalidateQueries({ queryKey: ["pocty-produktu"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import se nepodařil");
    } finally {
      setPrubeh(null);
    }
  };

  const souhrn = feed ? shrnUpozorneni(feed.upozorneni) : [];

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h2 className="section-title text-2xl">Import od dodavatelů</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Vyberte soubor od dodavatele. Uvidíte, co se stane, a teprve pak potvrdíte.
        </p>
      </div>

      {/* VÝBĚR SOUBORU */}
      {!hotovo && (
        <div className="rounded-lg border-2 border-dashed bg-card p-8 text-center shadow-card">
          <p className="text-lg font-bold">Vyberte soubor</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Můžete jich vybrat i víc najednou — podržte Cmd a klikejte.
          </p>
          <Input
            id="soubor"
            type="file"
            accept=".xml,.csv,.txt"
            multiple
            className="mx-auto mt-4 max-w-sm"
            onChange={(e) => {
              const soubory = Array.from(e.target.files ?? []);
              if (soubory.length) void nactiSoubory(soubory);
              e.target.value = "";
            }}
          />
          {prubeh && <p className="mt-3 text-sm text-muted-foreground">{prubeh}</p>}
        </div>
      )}

      {/* CO SE STANE */}
      {plan && feed && (
        <div className="grid gap-5 rounded-lg border-2 border-primary bg-card p-6 shadow-card">
          <div>
            <p className="text-2xl font-bold">
              Přibude {plan.novych} {plan.novych === 1 ? "kolo" : plan.novych < 5 ? "kola" : "kol"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.aktualizaci > 0 && <>U {plan.aktualizaci} kol se doplní sklad a čárové kódy. </>}
              {plan.preskocenych > 0 && <>{plan.preskocenych} se přeskočí. </>}
              Nová kola budou zatím skrytá, zveřejníte je až po kontrole.
            </p>
          </div>

          {plan.zmenyCen > 0 && (
            <p className="rounded-md border bg-surface p-4 text-sm">
              U {plan.zmenyCen} kol posílá dodavatel jinou cenu, než máte na webu.{" "}
              <span className="font-semibold">Vaše ceny zůstanou.</span>
            </p>
          )}

          {/* Zařazení — ukazuje se jen když je co řešit */}
          {nezarazene.length === 0 ? (
            <p className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Všechna kola jsme zařadili do kategorií sami.
              <button
                type="button"
                className="underline hover:text-primary"
                onClick={() => setRozbaleno(!rozbaleno)}
              >
                {rozbaleno ? "Skrýt" : "Zkontrolovat"}
              </button>
            </p>
          ) : (
            <div className="rounded-md border-2 border-dashed p-4">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-primary" />
                {nezarazene.length === 1
                  ? "U jedné skupiny nevíme, kam patří"
                  : `U ${nezarazene.length} skupin nevíme, kam patří`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vyberte kategorii, nebo nechte být — co zůstane prázdné, se nenaimportuje.
              </p>
              <div className="mt-3 grid gap-2">
                {nezarazene.map((k) => (
                  <div key={k.nazev} className="grid items-center gap-2 sm:grid-cols-[1fr_1fr]">
                    <span className="text-sm">
                      <span className="font-semibold">{k.nazev || "(bez kategorie)"}</span>{" "}
                      <span className="text-muted-foreground">— {k.pocet} kol</span>
                    </span>
                    <select
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={mapovani[k.nazev] ?? ""}
                      onChange={(e) => {
                        const m = { ...mapovani, [k.nazev]: e.target.value };
                        setMapovani(m);
                        prepocitej(m);
                      }}
                    >
                      <option value="">— neimportovat —</option>
                      {nase.map((x) => (
                        <option key={x.id} value={x.id}>
                          {popisSekce(x.sekce)} · {x.znacka ?? "—"} · {x.nazev}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rozbaleno && (
            <div className="max-h-72 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {kategorieFeedu.map((k) => (
                    <tr key={k.nazev}>
                      <td className="px-3 py-2">{k.nazev || "(bez kategorie)"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{k.pocet} kol</td>
                      <td className="px-3 py-2">
                        {mapovani[k.nazev]
                          ? nase.find((x) => x.id === mapovani[k.nazev])?.nazev
                          : "nenaimportuje se"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => void spustit()} disabled={!!prubeh || plan.novych + plan.aktualizaci === 0}>
              <Upload className="mr-2 h-5 w-5" />
              {prubeh ?? `Naimportovat ${plan.novych + plan.aktualizaci} kol`}
            </Button>
            <Button
              variant="ghost"
              disabled={!!prubeh}
              onClick={() => {
                setFeed(null);
                setPlan(null);
              }}
            >
              Zrušit
            </Button>
          </div>

          {souhrn.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Co bude potřeba dodělat ručně
              </summary>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {souhrn.map((s) => (
                  <li key={s.druh}>
                    <span className="font-semibold">{s.pocet}×</span> {s.popis}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Není to chyba importu — takhle to poslal dodavatel.
              </p>
            </details>
          )}

          {plan.radky.some((r) => r.akce === "novy") && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Ukázat, která kola přibudou
              </summary>
              <ul className="mt-2 max-h-60 space-y-1 overflow-auto text-muted-foreground">
                {plan.radky
                  .filter((r) => r.akce === "novy")
                  .map((r) => (
                    <li key={r.produkt.kod}>{nazevProWeb(r.produkt)}</li>
                  ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* HOTOVO */}
      {hotovo && (
        <div className="rounded-lg border-2 border-primary bg-card p-6 shadow-card">
          <h3 className="flex items-center gap-2 text-xl font-bold">
            <CheckCircle2 className="h-6 w-6 text-primary" /> Hotovo
          </h3>
          <p className="mt-2">
            Přibylo {hotovo.novych} kol
            {hotovo.aktualizovano > 0 && <>, u {hotovo.aktualizovano} se doplnil sklad</>}.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Nová kola jsou zatím <span className="font-semibold">skrytá</span>. Najdete je v Produktech —
            projděte je, stáhněte fotky a pak je hromadně zveřejněte.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => setHotovo(null)}>
            Naimportovat další soubor
          </Button>
        </div>
      )}
    </div>
  );
}
