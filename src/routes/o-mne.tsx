import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import majitel from "@/assets/majitel-hero.jpg";

export const Route = createFileRoute("/o-mne")({
  head: () => ({
    meta: [
      { title: "O mně — Petr z prodejny Cursorbike v Kravařích" },
      {
        name: "description",
        content:
          "Poznejte Petra, majitele prodejny a servisu Cursorbike. Dvacet let u kol, osobní přístup a servis všech značek.",
      },
      { property: "og:title", content: "O mně — Cursorbike" },
      {
        property: "og:description",
        content: "Majitel prodejny Cursorbike o tom, jak vybírá kola a proč dělá servis sám.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OMne,
});

const body = [
  "Elektrokola City a E-kola",
  "Horská a trekkingová kola",
  "Kola s nízkým nástupem",
  "Servis všech značek",
];

function OMne() {
  return (
    <div>
      <section className="bg-ink py-14 text-ink-foreground">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Cursorbike Kravaře
          </span>
          <h1 className="mt-4 text-4xl font-bold uppercase leading-[1.05] md:text-5xl">
            O mně a <span className="text-primary">o prodejně</span>
          </h1>
          <p className="mt-4 max-w-2xl text-ink-muted">
            Ahoj, jsem Petr, cyklistický nadšenec. Kola jsou moje práce i koníček už přes dvacet let.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-10 rounded-lg border bg-card p-6 shadow-card md:grid-cols-[320px_minmax(0,1fr)] md:p-10">
          <img
            src={majitel}
            alt="Petr, majitel prodejny Cursorbike, ve své dílně"
            width={1600}
            height={1104}
            className="h-72 w-full rounded-lg object-cover md:h-full"
          />
          <div>
            <h2 className="section-title text-3xl">Kolům se věnuji přes dvacet let</h2>
            <p className="mt-4 text-muted-foreground">
              Nejdřív jako závodník, dnes jako mechanik a prodejce. Všechno, co tady najdete, mám osobně projeté.
              Nikdy vám neprodám kolo, na které bych sám nesedl.
            </p>
            <p className="mt-3 text-muted-foreground">
              V dílně dělám všechno sám, takže víte, kdo se o vaše kolo stará. Přijďte se poradit — káva je u nás
              zdarma.
            </p>
            <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
              {body.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/servis">Rezervovat servis</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/kontakt">Napsat mi</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
