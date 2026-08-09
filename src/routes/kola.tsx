import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { produkty } from "@/lib/produkty";

export const Route = createFileRoute("/kola")({
  head: () => ({
    meta: [
      { title: "Kola — horská a trekkingová kola | Cursorbike" },
      { name: "description", content: "Horská, trekkingová a městská kola skladem. Vše seřízené a připravené k jízdě." },
      { property: "og:title", content: "Kola | Cursorbike" },
      { property: "og:description", content: "Vybraná horská a trekkingová kola z naší prodejny v Kravařích." },
    ],
  }),
  component: KolaPage,
});

function KolaPage() {
  const seznam = produkty.filter((p) => p.kategorie === "kola");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="section-title text-4xl">Kola</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Horská, trekkingová i městská kola. Každé kolo před předáním kompletně seřídíme a nastavíme podle vaší
        postavy.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {seznam.map((p) => (
          <ProductCard key={p.slug} produkt={p} />
        ))}
      </div>
    </div>
  );
}
