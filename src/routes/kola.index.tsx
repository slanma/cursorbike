import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { formatCena, kolaSekce, sekceKol } from "@/lib/produkty";

export const Route = createFileRoute("/kola/")({
  head: () => ({
    meta: [
      { title: "Jízdní kola — pánská, dámská a dětská | Cursorbike" },
      {
        name: "description",
        content: "Vyberte si sekci: pánská, dámská nebo dětská jízdní kola. Horská kola 26\", 27,5\" a 29\" skladem v Kravařích.",
      },
      { property: "og:title", content: "Jízdní kola | Cursorbike" },
      { property: "og:description", content: "Pánská, dámská a dětská kola — jednoduchý výběr podle velikosti." },
    ],
  }),
  component: KolaPrehled,
});

function KolaPrehled() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="section-title text-4xl">Jízdní kola</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Vyberte sekci a pak jen velikost kol. Každé kolo před předáním kompletně seřídíme a nastavíme podle vaší
        postavy.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sekceKol.map((sekce) => {
          const kola = kolaSekce(sekce.slug);
          const top = [...kola].sort((a, b) => b.cena - a.cena)[0];

          return (
            <Link
              key={sekce.slug}
              to="/kola/$sekce"
              params={{ sekce: sekce.slug }}
              className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-card transition-shadow hover:shadow-lg"
            >
              <div className="relative flex h-56 items-center justify-center bg-surface">
                {top ? (
                  <img
                    src={top.obrazek}
                    alt={`${sekce.nazev} jízdní kola — ${top.nazev}`}
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
                <h2 className="text-xl font-bold">{sekce.nazev}</h2>
                <p className="text-sm text-muted-foreground">{sekce.popis}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {sekce.velikosti.map((v) => (
                    <span key={v} className="rounded border px-2 py-1 text-xs font-semibold">
                      Horská {v}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  {top && (
                    <div>
                      <div className="text-xs text-muted-foreground">Top model v sekci</div>
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
