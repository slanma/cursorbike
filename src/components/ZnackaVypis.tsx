import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { produktyZnacky, type Kategorie, type Znacka } from "@/lib/produkty";

export function ZnackaVypis({ kategorie, znacka }: { kategorie: Kategorie; znacka: Znacka }) {
  const [podkategorie, setPodkategorie] = useState<string | null>(null);
  const vse = produktyZnacky(kategorie, znacka.slug);
  const seznam = podkategorie ? vse.filter((p) => p.podkategorie === podkategorie) : vse;
  const nadrazena = kategorie === "kola" ? "/kola" : "/elektrokola";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <Link to={nadrazena} className="text-sm font-semibold text-primary hover:underline">
        ← Zpět na {kategorie === "kola" ? "kola" : "elektrokola"}
      </Link>
      <h1 className="section-title mt-3 text-4xl">
        {kategorie === "kola" ? "Jízdní kola" : "Elektrokola"} — {znacka.nazev}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{znacka.popis}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPodkategorie(null)}
          className={`rounded border px-3 py-2 text-sm font-semibold transition-colors ${
            podkategorie === null ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"
          }`}
        >
          Vše
        </button>
        {znacka.podkategorie.map((pk) => (
          <button
            key={pk.slug}
            type="button"
            onClick={() => setPodkategorie(pk.slug)}
            className={`rounded border px-3 py-2 text-sm font-semibold transition-colors ${
              podkategorie === pk.slug ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"
            }`}
          >
            {pk.nazev}
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
        <p className="mt-10 text-muted-foreground">
          V této kategorii právě nemáme skladem — ozvěte se nám, rádi kolo objednáme.
        </p>
      )}
    </div>
  );
}
