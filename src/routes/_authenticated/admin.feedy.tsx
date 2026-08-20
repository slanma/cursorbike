import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { nactiKategorie, nactiMapovani, ulozMapovani } from "@/lib/eshop";
import { nactiFeed, shrnUpozorneni, type FeedVysledek } from "@/lib/feed";
import {
  nactiProPorovnani,
  nazevProWeb,
  provedImport,
  sestavPlan,
  type ExistujiciProdukt,
  type Mapovani,
  type Plan,
} from "@/lib/feed-import";
import { formatCena } from "@/lib/produkty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/feedy")({
  component: ImportFeedu,
});

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

function ImportFeedu() {
  const qc = useQueryClient();
  const [feed, setFeed] = useState<FeedVysledek | null>(null);
  const [nazevSouboru, setNazevSouboru] = useState("");
  const [mapovani, setMapovani] = useState<Mapovani>({});
  const [existujici, setExistujici] = useState<ExistujiciProdukt[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [prubeh, setPrubeh] = useState<string | null>(null);
  const [hotovo, setHotovo] = useState<{ novych: number; aktualizovano: number } | null>(null);

  const kategorie = useQuery({ queryKey: ["admin-kategorie"], queryFn: nactiKategorie });

  const kategorieFeedu = feed
    ? [...new Set(feed.produkty.map((p) => p.kategorieFeed))]
        .map((k) => ({ nazev: k, pocet: feed.produkty.filter((p) => p.kategorieFeed === k).length }))
        .sort((a, b) => b.pocet - a.pocet)
    : [];

  const nactiSoubor = async (soubor: File) => {
    setFeed(null);
    setPlan(null);
    setHotovo(null);
    setPrubeh("Čtu soubor…");
    try {
      const text = await precti(soubor);
      const vysledek = nactiFeed(soubor.name, text);
      const [ulozene, produkty] = await Promise.all([nactiMapovani(), nactiProPorovnani()]);
      setFeed(vysledek);
      setNazevSouboru(soubor.name);
      setExistujici(produkty);
      setMapovani(ulozene ?? {});
      toast.success(`Načteno ${vysledek.produkty.length} produktů`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Soubor se nepodařilo přečíst");
    } finally {
      setPrubeh(null);
    }
  };

  const pripravPlan = () => {
    if (!feed) return;
    setPlan(sestavPlan(feed, existujici, mapovani));
  };

  const spustit = async () => {
    if (!plan) return;
    setPrubeh("Spouštím import…");
    try {
      await ulozMapovani(mapovani);
      const v = await provedImport(plan, existujici, setPrubeh);
      setHotovo(v);
      setPlan(null);
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
      qc.invalidateQueries({ queryKey: ["verejne-produkty"] });
      toast.success("Import dokončen");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import se nepodařil");
    } finally {
      setPrubeh(null);
    }
  };

  const souhrn = feed ? shrnUpozorneni(feed.upozorneni) : [];

  return (
    <div className="grid gap-8">
      <div>
        <h2 className="section-title text-2xl">Import od dodavatelů</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nahrajte soubor od dodavatele — XML od Authora nebo CSV z PrestaShopu (Crussis). Nic se nezapíše,
          dokud import nepotvrdíte.
        </p>
      </div>

      {/* 1. SOUBOR */}
      <section className="grid gap-3 rounded-lg border bg-card p-6 shadow-card">
        <Label htmlFor="soubor" className="text-base font-bold">
          1. Vyberte soubor
        </Label>
        <Input
          id="soubor"
          type="file"
          accept=".xml,.csv,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void nactiSoubor(f);
            e.target.value = "";
          }}
        />
        {prubeh && <p className="text-sm text-muted-foreground">{prubeh}</p>}
        {feed && (
          <p className="text-sm">
            <span className="font-semibold">{nazevSouboru}</span> — dodavatel{" "}
            <span className="font-semibold capitalize">{feed.dodavatel}</span>, ve feedu{" "}
            {feed.polozekVeFeedu} položek, po seskupení podle barvy a velikosti{" "}
            <span className="font-semibold">{feed.produkty.length} produktů</span>.
          </p>
        )}
      </section>

      {/* 2. KATEGORIE */}
      {feed && (
        <section className="grid gap-4 rounded-lg border bg-card p-6 shadow-card">
          <div>
            <h3 className="text-base font-bold">2. Kam co patří</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Vlevo je kategorie tak, jak ji píše dodavatel. Vpravo vyberte, kam patří u vás. Co necháte
              nepřiřazené, se nenaimportuje. Přiřazení si zapamatujeme na příště.
            </p>
          </div>

          <div className="grid gap-2">
            {kategorieFeedu.map((k) => (
              <div key={k.nazev} className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <span className="text-sm">
                  <span className="font-semibold">{k.nazev || "(bez kategorie)"}</span>{" "}
                  <span className="text-muted-foreground">— {k.pocet} produktů</span>
                </span>
                <span aria-hidden className="hidden text-muted-foreground sm:inline">
                  →
                </span>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={mapovani[k.nazev] ?? ""}
                  onChange={(e) => setMapovani({ ...mapovani, [k.nazev]: e.target.value })}
                >
                  <option value="">— neimportovat —</option>
                  {(kategorie.data ?? []).map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.sekce === "elektrokola" ? "Elektrokola" : x.sekce === "bazar" ? "Bazar" : "Kola"} ·{" "}
                      {x.znacka ?? "—"} · {x.nazev}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div>
            <Button onClick={pripravPlan}>Zobrazit náhled</Button>
          </div>
        </section>
      )}

      {/* UPOZORNĚNÍ */}
      {feed && souhrn.length > 0 && (
        <section className="rounded-lg border bg-surface p-6">
          <h3 className="flex items-center gap-2 text-base font-bold">
            <AlertTriangle className="h-4 w-4 text-primary" /> Co bude potřeba dodělat
          </h3>
          <ul className="mt-3 space-y-1 text-sm">
            {souhrn.map((s) => (
              <li key={s.druh}>
                <span className="font-semibold">{s.pocet}×</span> {s.popis}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Není to chyba importu — takhle to poslal dodavatel. Doplnit se to dá ručně u produktu.
          </p>
        </section>
      )}

      {/* 3. NÁHLED */}
      {plan && (
        <section className="grid gap-4 rounded-lg border bg-card p-6 shadow-card">
          <h3 className="text-base font-bold">3. Náhled — co se stane</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-surface p-4">
              <div className="text-2xl font-bold">{plan.novych}</div>
              <div className="text-sm text-muted-foreground">nových produktů (založí se skryté)</div>
            </div>
            <div className="rounded-lg border bg-surface p-4">
              <div className="text-2xl font-bold">{plan.aktualizaci}</div>
              <div className="text-sm text-muted-foreground">se aktualizuje (sklad a kódy)</div>
            </div>
            <div className="rounded-lg border bg-surface p-4">
              <div className="text-2xl font-bold">{plan.preskocenych}</div>
              <div className="text-sm text-muted-foreground">se přeskočí</div>
            </div>
          </div>

          {plan.zmenyCen > 0 && (
            <p className="rounded-lg border bg-surface p-4 text-sm">
              U <span className="font-semibold">{plan.zmenyCen}</span> produktů posílá dodavatel jinou cenu, než
              máte na webu. <span className="font-semibold">Ceny se nepřepíšou.</span> Uloží se stranou a
              najdete je v Produktech u každého kola, kde je můžete převzít.
            </p>
          )}

          <div className="max-h-96 overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-left">
                <tr>
                  <th className="px-3 py-2">Produkt</th>
                  <th className="px-3 py-2">Velikosti</th>
                  <th className="px-3 py-2">Cena od dodavatele</th>
                  <th className="px-3 py-2">Skladem</th>
                  <th className="px-3 py-2">Co se stane</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plan.radky.slice(0, 300).map((r) => (
                  <tr key={`${r.produkt.dodavatel}-${r.produkt.kod}`}>
                    <td className="px-3 py-2">{nazevProWeb(r.produkt)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {r.produkt.varianty.map((v) => v.velikost).filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-3 py-2">{r.cena > 0 ? formatCena(r.cena) : "—"}</td>
                    <td className="px-3 py-2">{r.skladem} ks</td>
                    <td className="px-3 py-2">
                      {r.akce === "novy" && <span className="font-semibold text-primary">nový</span>}
                      {r.akce === "aktualizace" && <span className="font-semibold">aktualizace</span>}
                      {r.akce === "preskoceno" && (
                        <span className="text-muted-foreground">přeskočí se — {r.duvod}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {plan.radky.length > 300 && (
            <p className="text-xs text-muted-foreground">
              Zobrazeno prvních 300 řádků z {plan.radky.length}. Naimportuje se všechno.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={spustit} disabled={!!prubeh || plan.novych + plan.aktualizaci === 0}>
              <Upload className="mr-2 h-4 w-4" />
              Naimportovat ({plan.novych + plan.aktualizaci})
            </Button>
            <Button variant="outline" onClick={() => setPlan(null)} disabled={!!prubeh}>
              Zpět
            </Button>
          </div>
        </section>
      )}

      {/* HOTOVO */}
      {hotovo && (
        <section className="rounded-lg border-2 border-primary bg-card p-6 shadow-card">
          <h3 className="flex items-center gap-2 text-base font-bold">
            <CheckCircle2 className="h-5 w-5 text-primary" /> Hotovo
          </h3>
          <p className="mt-2 text-sm">
            Založeno <span className="font-semibold">{hotovo.novych}</span> nových produktů, aktualizováno{" "}
            <span className="font-semibold">{hotovo.aktualizovano}</span>.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Nové produkty jsou <span className="font-semibold">zatím skryté</span>. Najdete je v Produktech ve
            sloupci „Na webu" jako Skryto — projděte je, doplňte fotky a popisy a přepínačem „Zobrazit na webu"
            je zveřejněte.
          </p>
        </section>
      )}

    </div>
  );
}
