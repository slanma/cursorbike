import { createFileRoute, Link } from "@tanstack/react-router";
import { ZnackaVypis } from "@/components/ZnackaVypis";
import { useZnacka } from "@/lib/katalog-hook";

export const Route = createFileRoute("/doplnky/$znacka")({
  head: () => ({
    meta: [
      { title: "Doplňky | Cursorbike" },
      { name: "description", content: "Doplňky a díly v prodejně Cursorbike v Kravařích." },
    ],
  }),
  component: ZnackaStranka,
});

function ZnackaStranka() {
  const { znacka: slug } = Route.useParams();
  // Značky jsou nově v databázi, takže je nelze ověřit v loaderu jako dřív —
  // seznam se načítá až v prohlížeči.
  const { znacka, nacita } = useZnacka("doplnky", slug);

  if (nacita) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-muted-foreground md:px-6">Načítáme nabídku…</div>;
  }

  if (!znacka) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center md:px-6">
        <h1 className="section-title text-3xl">Značku jsme nenašli</h1>
        <p className="mt-3 text-muted-foreground">
          Tuto značku už nenabízíme.{" "}
          <Link to="/doplnky" className="font-semibold text-primary">
            Zpět na přehled
          </Link>
        </p>
      </div>
    );
  }

  return <ZnackaVypis kategorie="doplnky" znacka={znacka} />;
}
