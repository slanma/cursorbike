import { createFileRoute, Link } from "@tanstack/react-router";
import { prodavajici } from "@/lib/pravni";

export const Route = createFileRoute("/ochrana-osobnich-udaju")({
  head: () => ({
    meta: [
      { title: "Zásady zpracování osobních údajů (GDPR) | Cursorbike" },
      {
        name: "description",
        content:
          "Jak Cursorbike zpracovává osobní údaje zákazníků podle GDPR — účely, právní základy, doba uchování, příjemci údajů a vaše práva.",
      },
      { property: "og:title", content: "Zásady zpracování osobních údajů | Cursorbike" },
      { property: "og:description", content: "Informace o zpracování osobních údajů podle GDPR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GdprPage,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="section-title mt-12 text-xl md:text-2xl">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground md:text-base">
      {children}
    </ul>
  );
}

const ucely = [
  {
    ucel: "Vyřízení objednávky a uzavření kupní smlouvy",
    udaje: "Jméno a příjmení, adresa, e-mail, telefon, obsah objednávky",
    zaklad: "Plnění smlouvy – čl. 6 odst. 1 písm. b) GDPR",
    doba: "Po dobu plnění smlouvy",
  },
  {
    ucel: "Vedení účetnictví a plnění daňových povinností",
    udaje: "Fakturační údaje, doklady o platbě",
    zaklad: "Právní povinnost – čl. 6 odst. 1 písm. c) GDPR",
    doba: "10 let (zákon o DPH a o účetnictví)",
  },
  {
    ucel: "Vyřízení reklamace a odstoupení od smlouvy",
    udaje: "Kontaktní údaje, číslo objednávky, popis vady, číslo účtu pro vrácení peněz",
    zaklad: "Plnění smlouvy a právní povinnost",
    doba: "Po dobu záruční lhůty a 3 roky po jejím uplynutí",
  },
  {
    ucel: "Poptávka servisu a objednání termínu",
    udaje: "Jméno, telefon, e-mail, popis závady, termín",
    zaklad: "Opatření před uzavřením smlouvy – čl. 6 odst. 1 písm. b) GDPR",
    doba: "3 roky od poslední komunikace",
  },
  {
    ucel: "Zasílání obchodních sdělení stávajícím zákazníkům",
    udaje: "E-mail, jméno",
    zaklad: "Oprávněný zájem – čl. 6 odst. 1 písm. f) GDPR, § 7 odst. 3 zák. č. 480/2004 Sb.",
    doba: "Do odmítnutí zasílání",
  },
  {
    ucel: "Analytické a marketingové cookies",
    udaje: "Údaje o používání webu, identifikátory zařízení",
    zaklad: "Souhlas – čl. 6 odst. 1 písm. a) GDPR",
    doba: "Do odvolání souhlasu, nejdéle 12 měsíců",
  },
];

function GdprPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="section-title text-3xl md:text-4xl">Zásady zpracování osobních údajů</h1>
      <p className="mt-2 text-sm text-muted-foreground">Účinné od {prodavajici.ucinnostOd}</p>

      <H2>1. Kdo údaje zpracovává (správce)</H2>
      <P>
        Správcem vašich osobních údajů je {prodavajici.jmeno}, se sídlem {prodavajici.sidlo}, IČO {prodavajici.ico},
        DIČ {prodavajici.dic}, zapsán {prodavajici.zapis} (dále jen „správce" nebo „prodejna").
      </P>
      <P>
        Kontakt ve věcech ochrany osobních údajů: e-mail{" "}
        <a className="text-primary hover:underline" href={prodavajici.emailHref}>{prodavajici.email}</a>, telefon{" "}
        <a className="text-primary hover:underline" href={prodavajici.telefonHref}>{prodavajici.telefon}</a>.
      </P>
      <P>
        Správce nejmenoval pověřence pro ochranu osobních údajů – s ohledem na rozsah a povahu zpracování mu tato
        povinnost podle čl. 37 GDPR nevzniká.
      </P>

      <H2>2. Jaké údaje a proč zpracováváme</H2>
      <P>
        Zpracováváme pouze údaje, které nám sami poskytnete (v objednávce, poptávce servisu nebo při komunikaci s námi),
        a to v následujícím rozsahu a pro tyto účely:
      </P>
      <div className="mt-4 space-y-4">
        {ucely.map((u) => (
          <div key={u.ucel} className="rounded-lg border bg-card p-4 shadow-card">
            <h3 className="font-semibold text-foreground">{u.ucel}</h3>
            <dl className="mt-2 grid gap-1 text-sm text-muted-foreground">
              <div className="flex gap-2"><dt className="min-w-28 font-medium text-foreground">Údaje:</dt><dd>{u.udaje}</dd></div>
              <div className="flex gap-2"><dt className="min-w-28 font-medium text-foreground">Právní základ:</dt><dd>{u.zaklad}</dd></div>
              <div className="flex gap-2"><dt className="min-w-28 font-medium text-foreground">Doba uchování:</dt><dd>{u.doba}</dd></div>
            </dl>
          </div>
        ))}
      </div>
      <P>
        Poskytnutí údajů pro vyřízení objednávky nebo poptávky servisu je smluvním požadavkem – bez nich nemůžeme
        objednávku vyřídit. Poskytnutí souhlasu s marketingovými cookies je zcela dobrovolné.
      </P>

      <H2>3. Komu údaje předáváme</H2>
      <P>
        Vaše údaje nikdy neprodáváme. Předáváme je pouze příjemcům, bez kterých nelze objednávku vyřídit nebo provozovat
        web, a to vždy v nezbytném rozsahu:
      </P>
      <UL>
        <li>dopravcům, kteří vám doručují zásilku (jméno, adresa, telefon, e-mail);</li>
        <li>poskytovatelům hostingu a technického provozu e-shopu (zpracovatelé, kteří údaje neužívají pro vlastní účely);</li>
        <li>účetní kanceláři a daňovému poradci;</li>
        <li>orgánům veřejné moci, pokud nám to ukládá zákon (finanční úřad, ČOI, soudy, Policie ČR).</li>
      </UL>
      <P>
        Údaje zpracováváme v rámci Evropské unie / Evropského hospodářského prostoru. K předání do třetí země dochází
        pouze tehdy, pokud je zajištěna odpovídající úroveň ochrany podle kapitoly V GDPR (rozhodnutí o odpovídající
        ochraně nebo standardní smluvní doložky).
      </P>

      <H2>4. Jak dlouho údaje uchováváme</H2>
      <P>
        Údaje uchováváme po dobu uvedenou u jednotlivých účelů v čl. 2. Po jejím uplynutí údaje bezpečně mažeme nebo
        anonymizujeme, s výjimkou dokladů, jejichž archivaci nám ukládá zákon.
      </P>

      <H2>5. Cookies</H2>
      <P>
        Na webu používáme <strong>nezbytné cookies</strong>, bez kterých web nefunguje (obsah košíku, přihlášení do
        správy, uložená volba souhlasu). Ty používáme na základě oprávněného zájmu a podle § 89 odst. 3 zákona
        č. 127/2005 Sb. k nim není potřeba souhlas.
      </P>
      <P>
        <strong>Analytické a marketingové cookies</strong> umísťujeme až po vašem předchozím souhlasu, který udělíte
        v cookie liště. Souhlas je dobrovolný a můžete jej kdykoli odvolat – stačí kliknout na „Nastavení cookies"
        v patičce webu. Odvolání souhlasu nemá vliv na zákonnost zpracování před jeho odvoláním.
      </P>

      <H2>6. Vaše práva</H2>
      <P>Ve vztahu ke svým osobním údajům máte podle GDPR tato práva:</P>
      <UL>
        <li><strong>právo na přístup</strong> – zjistit, jaké údaje o vás zpracováváme, a získat jejich kopii (čl. 15);</li>
        <li><strong>právo na opravu</strong> nepřesných nebo neúplných údajů (čl. 16);</li>
        <li><strong>právo na výmaz</strong> („právo být zapomenut"), pokud pominul důvod zpracování (čl. 17);</li>
        <li><strong>právo na omezení zpracování</strong> (čl. 18);</li>
        <li><strong>právo na přenositelnost</strong> údajů ve strojově čitelném formátu (čl. 20);</li>
        <li><strong>právo vznést námitku</strong> proti zpracování na základě oprávněného zájmu, včetně přímého marketingu (čl. 21);</li>
        <li><strong>právo odvolat souhlas</strong> kdykoli, byl-li zpracování založeno na souhlasu (čl. 7 odst. 3);</li>
        <li><strong>právo nebýt předmětem automatizovaného rozhodování</strong> – žádné takové rozhodování ani profilování neprovádíme (čl. 22).</li>
      </UL>
      <P>
        Svá práva uplatníte e-mailem na{" "}
        <a className="text-primary hover:underline" href={prodavajici.emailHref}>{prodavajici.email}</a> nebo písemně na
        adrese {prodavajici.sidlo}. Vyřídíme je bez zbytečného odkladu, nejpozději do jednoho měsíce od doručení
        žádosti. Můžeme přitom požádat o ověření vaší totožnosti, abychom údaje nevydali nesprávné osobě.
      </P>

      <H2>7. Stížnost u dozorového úřadu</H2>
      <P>
        Domníváte-li se, že zpracováním vašich údajů porušujeme GDPR, máte právo podat stížnost u dozorového úřadu:
      </P>
      <div className="mt-4 rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Úřad pro ochranu osobních údajů</strong>
        <br />
        Pplk. Sochora 27, 170 00 Praha 7
        <br />
        <a className="text-primary hover:underline" href="https://www.uoou.cz" target="_blank" rel="noreferrer noopener">
          www.uoou.cz
        </a>
      </div>

      <H2>8. Zabezpečení údajů</H2>
      <P>
        Údaje chráníme technickými a organizačními opatřeními odpovídajícími riziku – šifrovaným přenosem (HTTPS),
        omezeným přístupem pouze pro pověřené osoby, přístupem do administrace chráněným heslem a pravidelnými
        zálohami.
      </P>

      <H2>9. Změny těchto zásad</H2>
      <P>
        Tyto zásady můžeme aktualizovat, zejména při změně zpracování nebo právních předpisů. Aktuální znění je vždy
        dostupné na této stránce s uvedením data účinnosti. Souvisejícím dokumentem jsou{" "}
        <Link to="/obchodni-podminky" className="text-primary hover:underline">obchodní podmínky</Link>.
      </P>
    </article>
  );
}
