import { createFileRoute, Link } from "@tanstack/react-router";
import { prodavajici } from "@/lib/pravni";

export const Route = createFileRoute("/odstoupeni-od-smlouvy")({
  head: () => ({
    meta: [
      { title: "Odstoupení od smlouvy do 14 dnů | Cursorbike" },
      {
        name: "description",
        content:
          "Jak vrátit zboží do 14 dnů bez udání důvodu — postup, lhůty, vrácení peněz a vzorový formulář pro odstoupení od smlouvy.",
      },
      { property: "og:title", content: "Odstoupení od smlouvy | Cursorbike" },
      { property: "og:description", content: "Vzorový formulář a postup pro vrácení zboží do 14 dnů." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OdstoupeniPage,
});

const radky = [
  "Označení zboží",
  "Číslo objednávky / faktury",
  "Datum objednání",
  "Datum obdržení zboží",
  "Jméno a příjmení spotřebitele",
  "Adresa spotřebitele",
  "E-mail / telefon",
  "Číslo bankovního účtu pro vrácení peněz",
];

function OdstoupeniPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="section-title text-3xl md:text-4xl">Odstoupení od smlouvy do 14 dnů</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
        Nakoupili jste v e-shopu a zboží vám nesedlo? Jako spotřebitel máte právo od smlouvy odstoupit bez udání důvodu
        do 14 dnů ode dne převzetí zboží (§ 1829 občanského zákoníku). Stačí nám to v této lhůtě oznámit — zboží pak
        pošlete nebo přivezete do 14 dnů od oznámení.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { c: "1", t: "Oznamte odstoupení", p: "E-mailem, dopisem nebo vyplněným formulářem níže — do 14 dnů od převzetí." },
          { c: "2", t: "Zašlete zboží zpět", p: "Do 14 dnů od oznámení na naši adresu. Náklady na vrácení hradí kupující." },
          { c: "3", t: "Vrátíme peníze", p: "Do 14 dnů, včetně nejlevnějšího nabízeného poštovného, stejným způsobem jako platbu." },
        ].map((k) => (
          <div key={k.c} className="rounded-lg border bg-card p-5 shadow-card">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
              {k.c}
            </span>
            <h2 className="mt-3 font-semibold text-foreground">{k.t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{k.p}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title mt-12 text-xl md:text-2xl">Kam odstoupení poslat</h2>
      <div className="mt-4 rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        <strong className="text-foreground">{prodavajici.jmeno}</strong>
        <br />
        {prodavajici.sidlo}
        <br />
        IČO: {prodavajici.ico}
        <br />
        E-mail: <a className="text-primary hover:underline" href={prodavajici.emailHref}>{prodavajici.email}</a>
        <br />
        Telefon: <a className="text-primary hover:underline" href={prodavajici.telefonHref}>{prodavajici.telefon}</a>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
        Přijetí odstoupení vám bez zbytečného odkladu potvrdíme e-mailem. Odstoupit můžete jakýmkoli jednoznačným
        prohlášením — použití formuláře níže není povinné, jen věci urychlí.
      </p>

      <h2 className="section-title mt-12 text-xl md:text-2xl">Na co si dát pozor u kol a elektrokol</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground md:text-base">
        <li>
          Kolo si můžete vyzkoušet obdobně jako v kamenné prodejně — posadit se, nastavit posed, krátce se projet uvnitř
          nebo na neveřejné ploše.
        </li>
        <li>
          Za snížení hodnoty odpovídáte, pokud dojde ke sjetí plášťů, poškrábání rámu nebo opotřebení pohonu a brzd
          běžným provozem na komunikaci (§ 1833 občanského zákoníku).
        </li>
        <li>
          Odstoupit nelze u zboží vyrobeného na míru podle vašich požadavků (ruční stavba kola, vlastní barva, výplet na
          zakázku) a u již provedeného servisního úkonu — viz čl. 7.8{" "}
          <Link to="/obchodni-podminky" className="text-primary hover:underline">obchodních podmínek</Link>.
        </li>
      </ul>

      <div className="mt-12 rounded-lg border bg-card p-6 shadow-card print:border-0 print:shadow-none">
        <h2 className="section-title text-lg">Vzorový formulář pro odstoupení od smlouvy</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Formulář vyplňte a odešlete pouze v případě, že chcete odstoupit od smlouvy. Vytiskněte jej, podepište
          a zašlete naskenovaný na e-mail výše, případně jej vložte do zásilky s vraceným zbožím.
        </p>

        <div className="mt-5 text-sm text-muted-foreground">
          <strong className="text-foreground">Adresát:</strong> {prodavajici.jmeno}, {prodavajici.sidlo}, IČO{" "}
          {prodavajici.ico}, e-mail {prodavajici.email}
        </div>

        <p className="mt-4 text-sm text-foreground">
          Oznamuji, že tímto odstupuji od smlouvy o nákupu tohoto zboží:
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {radky.map((r) => (
                <tr key={r}>
                  <td className="w-1/2 bg-muted/40 px-4 py-3 font-medium">{r}</td>
                  <td className="px-4 py-3">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p>Datum: ............................</p>
          <p>Podpis spotřebitele (pouze pokud je formulář zasílán v listinné podobě): ............................</p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 print:hidden"
        >
          Vytisknout formulář
        </button>
      </div>
    </article>
  );
}
