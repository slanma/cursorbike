import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { produkty } from "@/lib/produkty";

export const Route = createFileRoute("/elektrokola")({
  head: () => ({
    meta: [
      { title: "Elektrokola — city i trekking | Cursorbike" },
      { name: "description", content: "Elektrokola s dojezdem až 130 km, plný servis a repase baterií u nás v dílně." },
      { property: "og:title", content: "Elektrokola | Cursorbike" },
      { property: "og:description", content: "Městská i trekkingová elektrokola skladem, s poradenstvím a servisem." },
    ],
  }),
  component: ElektrokolaPage,
});

function ElektrokolaPage() {
  const seznam = produkty.filter((p) => p.kategorie === "elektrokola");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="section-title text-4xl">Elektrokola</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Vybraná elektrokola pro město i delší výlety. Baterie repasujeme přímo u nás, takže se o vás postaráme
        i po letech.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {seznam.map((p) => (
          <ProductCard key={p.slug} produkt={p} />
        ))}
      </div>
    </div>
  );
}
