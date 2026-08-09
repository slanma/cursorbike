import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Drobky } from "@/components/Drobky";
import { type Kategorie, type Znacka } from "@/lib/produkty";
import { useVsechnyProdukty } from "@/lib/produkty-hook";

export function ZnackaVypis({ kategorie, znacka }: { kategorie: Kategorie; znacka: Znacka }) {
  const [podkategorie, setPodkategorie] = useState<string | null>(null);
  const { produkty } = useVsechnyProdukty();
  const vse = produkty.filter((p) => p.kategorie === kategorie && p.znacka === znacka.slug);
  const seznam = podkategorie ? vse.filter((p) => p.podkategorie === podkategorie) : vse;
  const nadrazena = kategorie === "kola" ? "/kola" : "/elektrokola";
  const nadrazenyNazev = kategorie === "kola" ? "Kola" : "Elektrokola";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <Drobky
        items={[
          { label: nadrazenyNazev, to: nadrazena },
          { label: znacka.nazev },
        ]}
      />
      <h1 className="section-title mt-1 text-4xl">
        {nadrazenyNazev} — {znacka.nazev}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{znacka.popis}</p>

      <p className="mt-6 text-sm text-muted-foreground">
        Vyberte typ kola, který hledáte — nebo nechte „Vše" a prohlédněte si celou nabídku:
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPodkategorie(null)}
          className={`rounded-md border-2 px-4 py-2.5 text-sm font-bold transition-colors ${
            podkategorie === null ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary hover:bg-primary/5"
          }`}
        >
          Vše
        </button>
        {znacka.podkategorie.map((pk) => (
          <button
            key={pk.slug}
            type="button"
            onClick={() => setPodkategorie(pk.slug)}
            className={`rounded-md border-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              podkategorie === pk.slug ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary hover:bg-primary/5"
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
