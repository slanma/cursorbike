import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { dostupnost, formatCena, type ParametrSkupina } from "@/lib/produkty";
import { useVsechnyProdukty } from "@/lib/produkty-hook";
import { useZnacka } from "@/lib/katalog-hook";
import { useKosik } from "@/lib/kosik";
import { Drobky } from "@/components/Drobky";

export const Route = createFileRoute("/kolo/$slug")({
  head: () => ({
    meta: [
      { title: "Detail kola | Cursorbike" },
      { name: "description", content: "Detail kola z nabídky prodejny Cursorbike v Kravařích." },
    ],
  }),
  component: DetailProduktu,
});

function DetailProduktu() {
  const { slug } = Route.useParams();
  const { produkty, nacita } = useVsechnyProdukty();
  const { pridat } = useKosik();
  const [velikost, setVelikost] = useState<string | null>(null);
  const [hlavniFotka, setHlavniFotka] = useState(0);
  const produkt = produkty.find((p) => p.slug === slug);
  const { znacka: znackaObj } = useZnacka(
    produkt?.kategorie ?? "kola",
    produkt?.znacka ?? "",
  );

  if (!produkt) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center md:px-6">
        <h1 className="section-title text-3xl">{nacita ? "Načítáme kolo…" : "Kolo jsme nenašli"}</h1>
        {!nacita && (
          <p className="mt-3 text-muted-foreground">
            Toto kolo už není v nabídce.{" "}
            <Link to="/kola" className="font-semibold text-primary">
              Zpět na kola
            </Link>
          </p>
        )}
      </div>
    );
  }

  const dalsi = produkty.filter((p) => p.slug !== produkt.slug).slice(0, 3);
  const stav = dostupnost(produkt);
  const musiVybratVelikost = produkt.velikosti.length > 0 && !velikost;
  const galerie = [produkt.obrazek, ...produkt.obrazky];


  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <Drobky
        items={[
          ...(produkt.kategorie === "bazar"
            ? [{ label: "Bazar", to: "/bazar" }]
            : [
                {
                  label: produkt.kategorie === "kola" ? "Kola" : "Elektrokola",
                  to: produkt.kategorie === "kola" ? "/kola" : "/elektrokola",
                },
                ...(znackaObj
                  ? [
                      {
                        label: znackaObj.nazev,
                        to: produkt.kategorie === "kola" ? "/kola/$znacka" : "/elektrokola/$znacka",
                        params: { znacka: produkt.znacka },
                      },
                    ]
                  : []),
              ]),
          { label: produkt.nazev },
        ]}
      />
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="rounded-lg border bg-surface p-6">
            <img
              src={galerie[hlavniFotka] ?? produkt.obrazek}
              alt={produkt.nazev}
              width={900}
              height={700}
              className="w-full object-contain"
            />
          </div>
          {galerie.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {galerie.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setHlavniFotka(i)}
                  aria-label={`Fotka ${i + 1}`}
                  className={`h-20 w-24 overflow-hidden rounded-md border-2 bg-surface transition-colors ${
                    i === hlavniFotka ? "border-primary" : "hover:border-primary/50"
                  }`}
                >
                  <img src={url} alt="" loading="lazy" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{produkt.typ}</span>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{produkt.nazev}</h1>
          <p className="mt-4 text-muted-foreground">{produkt.popis}</p>

          <div className="mt-6 flex items-end gap-3">
            {produkt.puvodniCena && (
              <span className="text-lg text-muted-foreground line-through">{formatCena(produkt.puvodniCena)}</span>
            )}
            <span className="text-3xl font-bold">{formatCena(produkt.cena)}</span>
          </div>

          <p className={`mt-2 font-semibold ${stav.lzeKoupit ? "text-primary" : "text-muted-foreground"}`}>
            {stav.text}
          </p>

          {produkt.velikosti.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold">
                Velikost rámu{" "}
                <span className="font-normal text-muted-foreground">— vyberte prosím jednu</span>
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {produkt.velikosti.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVelikost(v)}
                    className={`rounded-md border-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                      velikost === v
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary hover:bg-primary/5"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Nevíte, jaká velikost je vaše? Zavolejte nám nebo se stavte na prodejnu — rádi změříme.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              disabled={!stav.lzeKoupit || musiVybratVelikost}
              onClick={() => {
                pridat(produkt.slug, velikost ?? undefined);
                toast.success("Přidáno do košíku", {
                  description: velikost ? `${produkt.nazev} — velikost ${velikost}` : produkt.nazev,
                });
              }}
            >
              {musiVybratVelikost ? "Nejdřív vyberte velikost" : "Přidat do košíku"}
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/kontakt">Domluvit testovací jízdu</Link>
            </Button>
          </div>

          <div className="mt-8 rounded-lg border bg-accent/40 p-5">
            <h2 className="section-title text-lg">Pro koho je kolo vhodné</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {produkt.proKoho.map((item: string) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="mt-0.5 font-bold text-primary">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {produkt.neniProKoho && (
              <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">{produkt.neniProKoho}</p>
            )}
          </div>

          <div className="mt-8 space-y-6">
            {produkt.parametry.map((skupina: ParametrSkupina) => (
              <div key={skupina.skupina}>
                <h2 className="section-title text-base text-muted-foreground">{skupina.skupina}</h2>
                <dl className="mt-2 divide-y rounded-lg border bg-card">
                  {skupina.polozky.map((p: { label: string; hodnota: string }) => (
                    <div key={p.label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">{p.label}</dt>
                      <dd className="text-right font-semibold">{p.hodnota}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </div>


      <h2 className="section-title mt-16 text-2xl">Mohlo by se hodit</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {dalsi.map((p) => (
          <article key={p.slug} className="rounded-lg border bg-card p-5 shadow-card">
            <img
              src={p.obrazek}
              alt={p.nazev}
              width={900}
              height={700}
              loading="lazy"
              className="h-40 w-full rounded bg-surface object-contain"
            />
            <h3 className="mt-4 font-bold">
              <Link to="/kolo/$slug" params={{ slug: p.slug }} className="hover:text-primary">
                {p.nazev}
              </Link>
            </h3>
            <p className="mt-1 text-sm font-semibold">{formatCena(p.cena)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
