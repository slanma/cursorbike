import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { kolaSekce, najdiSekci, sekceKol, type SekceSlug } from "@/lib/produkty";

export const Route = createFileRoute("/kola/$sekce")({
  loader: ({ params }) => {
    const sekce = najdiSekci(params.sekce);
    if (!sekce) throw notFound();
    return { sekce };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Sekce nenalezena | Cursorbike" }, { name: "robots", content: "noindex" }] };
    }
    const t = `${loaderData.sekce.nazev} jízdní kola | Cursorbike`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.sekce.popis },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.sekce.popis },
      ],
    };
  },
  component: SekcePage,
});

function SekcePage() {
  const { sekce } = Route.useLoaderData() as { sekce: (typeof sekceKol)[number] };
  const [velikost, setVelikost] = useState<string | null>(null);
  const vse = kolaSekce(sekce.slug as SekceSlug);
  const seznam = velikost ? vse.filter((p) => p.velikost === velikost) : vse;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <Link to="/kola" className="text-sm font-semibold text-primary hover:underline">
        ← Zpět na kola
      </Link>
      <h1 className="section-title mt-3 text-4xl">Jízdní kola — {sekce.nazev}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{sekce.popis}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setVelikost(null)}
          className={`rounded border px-3 py-2 text-sm font-semibold transition-colors ${
            velikost === null ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"
          }`}
        >
          Vše
        </button>
        {sekce.velikosti.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVelikost(v)}
            className={`rounded border px-3 py-2 text-sm font-semibold transition-colors ${
              velikost === v ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"
            }`}
          >
            Horská {v}
          </button>
        ))}
      </div>

      {seznam.length ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {seznam.map((p) => (
            <ProductCard key={p.slug} produkt={p} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-muted-foreground">V této velikosti právě nemáme kola skladem — ozvěte se nám, rádi je objednáme.</p>
      )}
    </div>
  );
}
