import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCena, najdiProdukt, produkty, type Produkt } from "@/lib/produkty";
import { useKosik } from "@/lib/kosik";

export const Route = createFileRoute("/kolo/$slug")({
  loader: ({ params }): { produkt: Produkt } => {
    const produkt = najdiProdukt(params.slug);
    if (!produkt) throw notFound();
    return { produkt };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Kolo nenalezeno | Cursorbike" }, { name: "robots", content: "noindex" }] };
    }
    const { produkt } = loaderData;
    return {
      meta: [
        { title: `${produkt.nazev} | Cursorbike` },
        { name: "description", content: produkt.kratky },
        { property: "og:title", content: `${produkt.nazev} | Cursorbike` },
        { property: "og:description", content: produkt.kratky },
      ],
    };
  },
  component: DetailProduktu,
});

function DetailProduktu() {
  const { produkt } = Route.useLoaderData();
  const { pridat } = useKosik();
  const dalsi = produkty.filter((p) => p.slug !== produkt.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="rounded-lg border bg-surface p-6">
          <img
            src={produkt.obrazek}
            alt={produkt.nazev}
            width={900}
            height={700}
            className="w-full object-contain"
          />
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

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => {
                pridat(produkt.slug);
                toast.success("Přidáno do košíku", { description: produkt.nazev });
              }}
            >
              Přidat do košíku
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/kontakt">Domluvit testovací jízdu</Link>
            </Button>
          </div>

          <dl className="mt-8 divide-y rounded-lg border bg-card">
            {produkt.parametry.map((p: { label: string; hodnota: string }) => (
              <div key={p.label} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">{p.label}</dt>
                <dd className="font-semibold">{p.hodnota}</dd>
              </div>
            ))}
          </dl>
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
