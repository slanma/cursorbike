import { Link } from "@tanstack/react-router";
import { ArrowRight, HelpCircle } from "lucide-react";
import { formatCena, type Kategorie } from "@/lib/produkty";
import { useVsechnyProdukty } from "@/lib/produkty-hook";
import { useKatalog } from "@/lib/katalog-hook";
import { Drobky } from "@/components/Drobky";

export function ZnackyPrehled({
  kategorie,
  nadpis,
  perex,
}: {
  kategorie: Kategorie;
  nadpis: string;
  perex: string;
}) {
  const { produkty } = useVsechnyProdukty();
  const { znacky, nacita } = useKatalog(kategorie);
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <Drobky items={[{ label: nadpis }]} />
      <h1 className="section-title text-4xl">{nadpis}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{perex}</p>

      <div className="mt-6 flex flex-col gap-2 rounded-lg border bg-accent/40 p-4 sm:flex-row sm:items-start sm:gap-3">
        <HelpCircle className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Nevíte, kterou značku?</span> Většina lidí vybírá podle
          toho, kdo na kolo pojede. Klikněte na značku a pak nahoře zvolte typ (Pánská / Dámská / Dětská …).
          Nejste si jistí? Zavolejte nám — rádi poradíme.
        </p>
      </div>

      {!nacita && znacky.length === 0 && (
        <p className="mt-10 rounded-lg border bg-card p-8 text-center text-muted-foreground shadow-card">
          Nabídku právě připravujeme. Zavolejte nám, rádi poradíme.
        </p>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {znacky.map((znacka) => {
          const kola = produkty.filter((p) => p.kategorie === kategorie && p.znacka === znacka.slug);
          const top = [...kola].sort((a, b) => b.cena - a.cena)[0];

          return (
            <Link
              key={znacka.slug}
              to={kategorie === "kola" ? "/kola/$znacka" : "/elektrokola/$znacka"}
              params={{ znacka: znacka.slug }}
              className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-card transition-shadow hover:shadow-lg"
            >
              <div className="flex h-56 items-center justify-center bg-surface">
                {top ? (
                  <img
                    src={top.obrazek}
                    alt={`${znacka.nazev} — ${top.nazev}`}
                    width={900}
                    height={700}
                    loading="lazy"
                    className="h-56 w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">Připravujeme</span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 className="text-xl font-bold">{znacka.nazev}</h2>
                <p className="text-sm text-muted-foreground">{znacka.popis}</p>
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  {znacka.podkategorie.map((pk) => (
                    <li key={pk.slug}>• {pk.nazev}</li>
                  ))}
                </ul>
                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  {top && (
                    <div>
                      <div className="text-xs text-muted-foreground">Top model</div>
                      <div className="text-lg font-bold">{formatCena(top.cena)}</div>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Vybrat <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
