import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { prodavajici } from "@/lib/pravni";
import { kanonicka } from "@/lib/seo";

export const Route = createFileRoute("/obchodni-podminky")({
  head: () => ({
    meta: [
      { title: "Obchodní podmínky | Cursorbike" },
      {
        name: "description",
        content:
          "Všeobecné obchodní podmínky e-shopu cursorbike.cz — uzavření smlouvy, doprava, platba, odstoupení do 14 dnů, reklamace a záruka.",
      },
      { property: "og:title", content: "Obchodní podmínky | Cursorbike" },
      { property: "og:description", content: "Podmínky nákupu v e-shopu Cursorbike." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [kanonicka("/obchodni-podminky")],
  }),
  component: ObchodniPodminky,
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

function ObchodniPodminky() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <h1 className="section-title text-3xl md:text-4xl">Všeobecné obchodní podmínky</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        internetového obchodu cursorbike.cz · účinné od {prodavajici.ucinnostOd}
      </p>

      <H2>1. Úvodní ustanovení</H2>
      <P>
        1.1 Tyto všeobecné obchodní podmínky (dále jen „obchodní podmínky") upravují vzájemná práva a povinnosti
        smluvních stran vzniklé v souvislosti nebo na základě kupní smlouvy uzavírané prostřednictvím internetového
        obchodu na adrese www.cursorbike.cz (dále jen „e-shop").
      </P>
      <P>1.2 Prodávající:</P>
      <div className="mt-4 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            <tr><td className="w-1/2 bg-muted/40 px-4 py-2 font-medium">Jméno / firma</td><td className="px-4 py-2">{prodavajici.jmeno}</td></tr>
            <tr><td className="bg-muted/40 px-4 py-2 font-medium">Sídlo</td><td className="px-4 py-2">{prodavajici.sidlo}</td></tr>
            <tr><td className="bg-muted/40 px-4 py-2 font-medium">IČO</td><td className="px-4 py-2">{prodavajici.ico}</td></tr>
            {prodavajici.dic && (
              <tr><td className="bg-muted/40 px-4 py-2 font-medium">DIČ</td><td className="px-4 py-2">{prodavajici.dic}</td></tr>
            )}
            <tr><td className="bg-muted/40 px-4 py-2 font-medium">Zapsán</td><td className="px-4 py-2">{prodavajici.zapis}</td></tr>
            {prodavajici.jednatel && (
              <tr><td className="bg-muted/40 px-4 py-2 font-medium">Zastoupen</td><td className="px-4 py-2">{prodavajici.jednatel}, jednatel</td></tr>
            )}
            <tr><td className="bg-muted/40 px-4 py-2 font-medium">E-mail</td><td className="px-4 py-2"><a className="text-primary hover:underline" href={prodavajici.emailHref}>{prodavajici.email}</a></td></tr>
            <tr><td className="bg-muted/40 px-4 py-2 font-medium">Telefon</td><td className="px-4 py-2"><a className="text-primary hover:underline" href={prodavajici.telefonHref}>{prodavajici.telefon}</a></td></tr>
            {prodavajici.datovaSchranka && (
              <tr><td className="bg-muted/40 px-4 py-2 font-medium">ID datové schránky</td><td className="px-4 py-2">{prodavajici.datovaSchranka}</td></tr>
            )}
            <tr><td className="bg-muted/40 px-4 py-2 font-medium">Adresa pro vracení zboží a reklamace</td><td className="px-4 py-2">{prodavajici.adresaProVraceni}</td></tr>
          </tbody>
        </table>
      </div>
      <P>(dále jen „prodávající")</P>
      <P>
        1.3 Právní vztahy mezi prodávajícím a kupujícím se řídí právním řádem České republiky, zejména zákonem
        č. 89/2012 Sb., občanský zákoník, v platném znění (dále jen „občanský zákoník"), a je-li kupující
        spotřebitelem, také zákonem č. 634/1992 Sb., o ochraně spotřebitele, v platném znění.
      </P>
      <P>
        1.4 Ustanovení odchylná od obchodních podmínek lze sjednat v kupní smlouvě; taková ujednání mají přednost před
        obchodními podmínkami.
      </P>
      <P>
        1.5 Znění obchodních podmínek může prodávající měnit či doplňovat. Změnou nejsou dotčena práva a povinnosti
        vzniklá po dobu účinnosti předchozího znění. Pro konkrétní objednávku je vždy rozhodné znění účinné ke dni
        jejího odeslání.
      </P>
      <P>
        1.6 Prodávající zašle kupujícímu znění obchodních podmínek v textové podobě (přílohou potvrzujícího e-mailu)
        tak, aby si je kupující mohl uložit a reprodukovat.
      </P>

      <H2>2. Vymezení pojmů</H2>
      <P>
        2.1 <strong>Spotřebitel</strong> – každý člověk, který mimo rámec své podnikatelské činnosti nebo mimo rámec
        samostatného výkonu svého povolání uzavírá smlouvu s prodávajícím nebo s ním jinak jedná (§ 419 občanského
        zákoníku).
      </P>
      <P>
        2.2 <strong>Podnikatel</strong> – kupující, který uzavírá smlouvu v souvislosti s vlastní obchodní, výrobní
        nebo obdobnou činností či při samostatném výkonu svého povolání, popřípadě osoba, která jedná jménem nebo na
        účet podnikatele. Na tohoto kupujícího se nevztahují ustanovení těchto obchodních podmínek o ochraně
        spotřebitele (zejména čl. 7 – odstoupení od smlouvy do 14 dnů a čl. 8 v rozsahu spotřebitelských práv).
      </P>
      <P>2.3 <strong>Kupující</strong> – spotřebitel i podnikatel společně.</P>
      <P>
        2.4 <strong>Zboží</strong> – jízdní kola, elektrokola, součástky, příslušenství a další produkty nabízené
        v e-shopu, včetně zboží použitého (kategorie „Bazar").
      </P>

      <H2>3. Informace poskytované před uzavřením smlouvy</H2>
      <P>3.1 Prodávající v souladu s § 1811 a § 1820 občanského zákoníku sděluje kupujícímu, že:</P>
      <UL>
        <li>náklady na prostředky komunikace na dálku se neliší od základní sazby a prodávající si neúčtuje žádné další poplatky;</li>
        <li>
          {prodavajici.platceDph
            ? "ceny zboží jsou uvedeny včetně DPH a všech souvisejících poplatků, s výjimkou nákladů na dodání, které jsou uvedeny samostatně v objednávkovém procesu;"
            : "prodávající není plátcem DPH; ceny zboží jsou uvedeny jako konečné včetně všech souvisejících poplatků, s výjimkou nákladů na dodání, které jsou uvedeny samostatně v objednávkovém procesu;"}
        </li>
        <li>prodávající nepožaduje zálohu ani jinou obdobnou platbu, s výjimkou zboží na zakázku nebo zboží upraveného podle přání kupujícího (o tom je kupující vždy předem informován);</li>
        <li>prodávající není ve vztahu ke kupujícímu vázán žádnými kodexy chování ve smyslu § 1826 odst. 1 písm. e) občanského zákoníku;</li>
        <li>smlouvu lze uzavřít v českém jazyce;</li>
        <li>uzavřená smlouva je prodávajícím archivována v elektronické podobě a není přístupná třetím osobám; kupujícímu je zaslána v textové podobě na jeho e-mail;</li>
        <li>kupující má právo od smlouvy odstoupit za podmínek uvedených v čl. 7;</li>
        <li>v případě sporu má spotřebitel právo na mimosoudní řešení sporu – viz čl. 13.</li>
      </UL>
      <P>
        3.2 <strong>Informace o cenách a slevách.</strong> Je-li u zboží uvedena sleva, prodávající vedle zlevněné ceny
        uvádí rovněž nejnižší cenu, za kterou zboží nabízel v době 30 dnů před poskytnutím slevy (§ 12a zákona
        o ochraně spotřebitele).
      </P>
      <P>
        3.3 <strong>Recenze.</strong> Zveřejňuje-li prodávající u zboží spotřebitelské recenze, uvádí zároveň, zda
        a jakým způsobem zajišťuje, že zveřejněné recenze pocházejí od spotřebitelů, kteří zboží skutečně zakoupili
        nebo použili (§ 5b zákona o ochraně spotřebitele).
      </P>
      <P>3.4 Fotografie u zboží mají ilustrativní charakter; rozhodující je textový popis a technická specifikace.</P>

      <H2>4. Uzavření kupní smlouvy</H2>
      <P>
        4.1 Prezentace zboží v e-shopu je informativního charakteru. Ustanovení § 1732 odst. 2 občanského zákoníku se
        nepoužije a prodávající není povinen uzavřít kupní smlouvu ohledně tohoto zboží.
      </P>
      <P>
        4.2 Kupující vloží zboží do košíku, zvolí způsob dopravy a platby, vyplní požadované údaje a před odesláním
        objednávky má možnost všechny zadané údaje zkontrolovat a změnit.
      </P>
      <P>
        4.3 Objednávku kupující odešle kliknutím na tlačítko označené „Objednávka zavazující k platbě" (§ 1826 odst. 2
        občanského zákoníku). Odesláním objednávky kupující potvrzuje, že se seznámil s těmito obchodními podmínkami
        a souhlasí s nimi.
      </P>
      <P>
        4.4 Kupní smlouva je uzavřena okamžikem doručení potvrzení objednávky ze strany prodávajícího na e-mailovou
        adresu kupujícího. Automaticky generované oznámení o přijetí objednávky do systému se za potvrzení objednávky
        nepovažuje, není-li v něm výslovně uvedeno jinak.
      </P>
      <P>
        4.5 Prodávající zašle kupujícímu bez zbytečného odkladu po uzavření smlouvy potvrzení o uzavřené smlouvě
        v textové podobě, včetně těchto obchodních podmínek, poučení o právu odstoupit od smlouvy a vzorového
        formuláře pro odstoupení (§ 1824a občanského zákoníku).
      </P>
      <P>4.6 Prodávající je oprávněn od smlouvy odstoupit, pokud:</P>
      <UL>
        <li>a) zboží se již nevyrábí, není dostupné a nelze jej nahradit; nebo</li>
        <li>
          b) došlo ke zjevné chybě v ceně zboží (cena se zjevně a podstatně odchyluje od obvyklé ceny, např.
          v důsledku technické chyby systému nebo lidského pochybení); nebo
        </li>
        <li>c) kupující nezaplatil kupní cenu ve lhůtě splatnosti u platby předem.</li>
      </UL>
      <P>
        O odstoupení prodávající kupujícího neprodleně informuje a již uhrazenou částku vrátí do 14 dnů na účet
        kupujícího. V případě podle písm. b) prodávající kupujícímu nabídne uzavření smlouvy za správnou cenu; smlouva
        je uzavřena, jakmile kupující nabídku výslovně přijme.
      </P>
      <P>4.7 Kupující souhlasí s použitím prostředků komunikace na dálku při uzavírání kupní smlouvy.</P>

      <H2>5. Kupní cena a platební podmínky</H2>
      <P>
        5.1 Všechny ceny uvedené v e-shopu jsou konečné
        {prodavajici.platceDph ? ", včetně DPH" : "; prodávající není plátcem DPH"}. Náklady na dodání zboží nejsou v ceně zboží
        zahrnuty a jsou uvedeny samostatně.
      </P>
      <P>5.2 Kupní cenu lze uhradit způsoby uvedenými v objednávkovém procesu, zejména:</P>
      <UL>
        <li>bezhotovostně převodem na bankovní účet prodávajícího (číslo účtu je uvedeno v potvrzení objednávky);</li>
        <li>dobírkou při převzetí zboží od dopravce;</li>
        <li>hotově nebo platební kartou při osobním odběru v prodejně v Kravařích.</li>
      </UL>
      <P>
        5.3 V případě bezhotovostní platby je kupní cena splatná do 7 dnů od uzavření kupní smlouvy; závazek kupujícího
        je splněn připsáním částky na účet prodávajícího.
      </P>
      <P>
        5.4 Prodávající vystaví kupujícímu daňový doklad a zašle jej v elektronické podobě na e-mail kupujícího, s čímž
        kupující souhlasí.
      </P>
      <P>5.5 Ceny v e-shopu se mohou lišit od cen v kamenné prodejně.</P>
      <P>
        5.6 Případné slevy z ceny zboží poskytnuté prodávajícím nelze vzájemně kombinovat, není-li výslovně uvedeno
        jinak.
      </P>

      <H2>6. Dodání zboží a přechod nebezpečí</H2>
      <P>
        6.1 Prodávající dodá zboží kupujícímu bez zbytečného odkladu, nejpozději do 30 dnů od uzavření kupní smlouvy,
        nedohodnou-li se strany jinak nebo není-li u zboží uvedena delší dodací lhůta.
      </P>
      <P>
        6.2 Nedodá-li prodávající zboží ve lhůtě podle odst. 6.1, může kupující od smlouvy odstoupit poté, co
        prodávajícímu poskytne dodatečnou přiměřenou lhůtu k plnění. Dodatečnou lhůtu není třeba poskytovat, pokud
        prodávající odmítl plnit nebo je-li dodání v ujednané lhůtě nezbytné s ohledem na okolnosti při uzavření
        smlouvy.
      </P>
      <P>6.3 Způsoby dodání a jejich ceny jsou uvedeny v objednávkovém procesu.</P>
      <P>
        6.4 Je-li kupujícím spotřebitel, přechází na něj nebezpečí škody na zboží okamžikem převzetí zboží
        spotřebitelem nebo jím určenou třetí osobou odlišnou od dopravce (§ 2159 odst. 2 občanského zákoníku). Určí-li
        dopravce spotřebitel, aniž mu byl prodávajícím nabídnut, přechází nebezpečí předáním zboží dopravci.
      </P>
      <P>6.5 Je-li kupujícím podnikatel, přechází nebezpečí škody na zboží předáním zboží prvnímu dopravci.</P>
      <P>
        6.6 Kupujícímu se doporučuje zásilku při převzetí zkontrolovat. Je-li obal viditelně poškozen, doporučuje se
        sepsat s dopravcem zápis o poškození, případně zásilku nepřevzít. Nesplnění tohoto doporučení nemá vliv na
        práva kupujícího z vadného plnění.
      </P>
      <P>
        6.7 Nepřevezme-li kupující zboží bez důvodu, je prodávající oprávněn požadovat náhradu skutečně vynaložených
        nákladů na doručení a uskladnění.
      </P>

      <H2>7. Odstoupení od smlouvy spotřebitelem (14 dnů)</H2>
      <P>
        7.1 Spotřebitel má právo odstoupit od kupní smlouvy uzavřené prostřednictvím prostředků komunikace na dálku bez
        udání důvodu ve lhůtě 14 dnů (§ 1829 občanského zákoníku).
      </P>
      <P>7.2 <strong>Běh lhůty.</strong> Lhůta začíná běžet ode dne převzetí zboží. Je-li předmětem smlouvy:</P>
      <UL>
        <li>několik kusů zboží objednaných v jedné objednávce a dodávaných samostatně – ode dne převzetí poslední dodávky;</li>
        <li>zboží sestávající z několika položek nebo částí – ode dne převzetí poslední položky nebo části;</li>
        <li>pravidelná opakovaná dodávka – ode dne převzetí první dodávky.</li>
      </UL>
      <P>Lhůta je zachována, je-li odstoupení odesláno prodávajícímu nejpozději poslední den lhůty.</P>
      <P>
        7.3 <strong>Nepoučení spotřebitele.</strong> Nebyl-li spotřebitel poučen o právu odstoupit od smlouvy, může
        odstoupit do 1 roku a 14 dnů od počátku běhu lhůty podle odst. 7.2. Byl-li poučen v průběhu této doby, běží
        14denní lhůta ode dne poučení (§ 1829 odst. 2 a 3 občanského zákoníku).
      </P>
      <P>7.4 <strong>Jak odstoupit.</strong> Spotřebitel může odstoupit jakýmkoli jednoznačným prohlášením učiněným vůči prodávajícímu, zejména:</P>
      <UL>
        <li>e-mailem na adresu <a className="text-primary hover:underline" href={prodavajici.emailHref}>{prodavajici.email}</a>;</li>
        <li>písemně na adresu {prodavajici.adresaProVraceni};</li>
        <li>
          vyplněním vzorového formuláře – viz stránka{" "}
          <Link to="/odstoupeni-od-smlouvy" className="text-primary hover:underline">Odstoupení od smlouvy</Link>.
        </li>
      </UL>
      <P>Prodávající potvrdí spotřebiteli přijetí odstoupení bez zbytečného odkladu v textové podobě.</P>
      <P>
        7.5 <strong>Vrácení zboží.</strong> Spotřebitel zašle nebo předá zboží prodávajícímu bez zbytečného odkladu,
        nejpozději do 14 dnů od odstoupení od smlouvy. Náklady na vrácení zboží nese spotřebitel, a to i v případě, kdy
        zboží nemůže být pro svou povahu vráceno obvyklou poštovní cestou (např. jízdní kolo v nadrozměrném balení).
      </P>
      <P>
        7.6 <strong>Vrácení peněz.</strong> Prodávající vrátí spotřebiteli všechny peněžní prostředky včetně nákladů na
        dodání zboží (odpovídajících nejlevnějšímu prodávajícím nabízenému způsobu dodání) do 14 dnů od odstoupení od
        smlouvy, a to stejným způsobem, jakým je přijal, nedohodnou-li se strany jinak. Prodávající není povinen vrátit
        peněžní prostředky dříve, než mu spotřebitel zboží předá nebo prokáže, že zboží odeslal (§ 1832 občanského
        zákoníku).
      </P>
      <P>
        7.7 <strong>Snížení hodnoty zboží.</strong> Spotřebitel odpovídá prodávajícímu za snížení hodnoty zboží, které
        vzniklo v důsledku nakládání s tímto zbožím jinak, než je nutné k tomu, aby se seznámil s jeho povahou,
        vlastnostmi a funkčností (§ 1833 občanského zákoníku). Prodávající je oprávněn jednostranně započíst nárok na
        náhradu snížení hodnoty proti nároku spotřebitele na vrácení kupní ceny; vzniklou újmu je prodávající povinen
        prokázat.
      </P>
      <div className="mt-4 rounded-lg border-l-4 border-primary bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Poznámka k jízdním kolům:</strong> vyzkoušení kola obdobně jako v kamenné
        prodejně (posazení, nastavení, krátká zkušební jízda uvnitř / na neveřejné ploše) je v pořádku. Za snížení
        hodnoty se považuje zejména sjetí pláště, poškrábání rámu, opotřebení pohonu nebo brzd v důsledku běžného
        provozu na komunikaci.
      </div>
      <P>
        7.8 <strong>Výjimky – kdy nelze odstoupit.</strong> Spotřebitel nemůže odstoupit od smlouvy zejména v případech
        uvedených v § 1837 občanského zákoníku, tj. mj. o dodávce zboží:
      </P>
      <UL>
        <li>a) vyrobeného podle požadavků spotřebitele nebo přizpůsobeného jeho osobním potřebám (např. ruční stavba kola na míru, vlastní barevné provedení, výplet na zakázku);</li>
        <li>b) které podléhá rychlé zkáze nebo bylo po dodání nenávratně smíseno s jiným zbožím;</li>
        <li>c) v zapečetěném obalu, které z důvodu ochrany zdraví nebo z hygienických důvodů není vhodné vrátit poté, co jej spotřebitel porušil;</li>
        <li>d) zvukové nebo obrazové nahrávky nebo počítačového programu v zapečetěném obalu, pokud jej spotřebitel porušil;</li>
        <li>e) novin, periodik nebo časopisů;</li>
        <li>f) o poskytování služby, byla-li splněna s předchozím výslovným souhlasem spotřebitele před uplynutím lhůty pro odstoupení a prodávající před uzavřením smlouvy sdělil, že v takovém případě právo odstoupit zanikne (např. dokončený servisní úkon);</li>
        <li>g) jehož cena závisí na výchylkách finančního trhu nezávisle na vůli prodávajícího.</li>
      </UL>
      <P>
        7.9 <strong>Dárky a zvýhodněné sady.</strong> Byl-li spolu se zbožím poskytnut dárek, pozbývá darovací smlouva
        odstoupením od kupní smlouvy účinnosti a spotřebitel je povinen dárek vrátit spolu se zbožím. Bylo-li zboží
        zakoupeno jako zvýhodněná sada, lze od smlouvy odstoupit pouze ohledně celé sady.
      </P>

      <H2>8. Práva z vadného plnění</H2>
      <P>
        8.1 <strong>Jakost při převzetí.</strong> Prodávající odpovídá kupujícímu, že zboží při převzetí nemá vady.
        Zejména že zboží (§ 2161 občanského zákoníku):
      </P>
      <UL>
        <li>a) odpovídá ujednanému popisu, druhu a množství, jakož i jakosti, funkčnosti, kompatibilitě, interoperabilitě a jiným ujednaným vlastnostem;</li>
        <li>b) je vhodné k účelu, pro který je kupující požaduje a s nímž prodávající souhlasil;</li>
        <li>c) je dodáno s ujednaným příslušenstvím a pokyny k použití, včetně návodu k montáži nebo instalaci;</li>
        <li>d) je vhodné k účelu, k němuž se zboží tohoto druhu obvykle používá;</li>
        <li>e) odpovídá jakostí nebo provedením vzorku nebo předloze, které prodávající poskytl před uzavřením smlouvy;</li>
        <li>f) odpovídá množstvím, jakostí a dalšími vlastnostmi obvyklým pro zboží téhož druhu, které může kupující rozumně očekávat, i s ohledem na veřejná prohlášení výrobce nebo prodávajícího.</li>
      </UL>
      <P>
        8.2 <strong>Domněnka vadnosti (12 měsíců).</strong> Projeví-li se vada v průběhu jednoho roku od převzetí, má
        se za to, že zboží bylo vadné již při převzetí, ledaže to povaha zboží nebo vady vylučuje. Tato doba neběží po
        dobu, po kterou kupující nemůže zboží užívat, v případě, že vadu vytkl oprávněně.
      </P>
      <P>
        8.3 <strong>Lhůta pro uplatnění.</strong> Kupující může vytknout vadu, která se u zboží projeví v době 2 let od
        převzetí. Vytkl-li kupující vadu oprávněně, doba pro uplatnění práv z vadného plnění neběží po dobu, po kterou
        kupující nemůže zboží užívat.
      </P>
      <P>8.4 <strong>Práva kupujícího.</strong> Má-li zboží vadu, může kupující požadovat její odstranění, a to podle své volby:</P>
      <UL>
        <li>dodáním nového zboží bez vady, nebo</li>
        <li>opravou zboží,</li>
      </UL>
      <P>
        ledaže je zvolený způsob nemožný nebo ve srovnání s druhým nepřiměřeně nákladný; to se posoudí zejména
        s ohledem na význam vady, hodnotu, kterou by zboží mělo bez vady, a to, zda může být druhým způsobem vada
        odstraněna bez značných obtíží pro kupujícího (§ 2169 občanského zákoníku).
      </P>
      <P>
        8.5 Prodávající odstraní vadu v přiměřené době po jejím vytknutí tak, aby tím kupujícímu nezpůsobil značné
        obtíže, a to bezplatně. Prodávající může odmítnout vadu odstranit, je-li to nemožné nebo nepřiměřeně nákladné.
      </P>
      <P>
        8.6 <strong>Sleva a odstoupení.</strong> Kupující může požadovat přiměřenou slevu z kupní ceny nebo odstoupit
        od smlouvy, pokud (§ 2171 občanského zákoníku):
      </P>
      <UL>
        <li>a) prodávající vadu odmítl odstranit nebo ji neodstranil v souladu s odst. 8.5;</li>
        <li>b) se vada projeví opakovaně;</li>
        <li>c) je vada podstatným porušením smlouvy; nebo</li>
        <li>d) je z prohlášení prodávajícího nebo z okolností zjevné, že vada nebude odstraněna v přiměřené době nebo bez značných obtíží pro kupujícího.</li>
      </UL>
      <P>
        Kupující nemůže odstoupit od smlouvy, je-li vada nevýznamná; má se za to, že vada není nevýznamná. Odstoupí-li
        kupující od smlouvy, prodávající mu vrátí kupní cenu bez zbytečného odkladu poté, co obdrží zboží nebo co mu
        kupující prokáže, že zboží odeslal.
      </P>
      <P>
        8.7 <strong>Použité zboží (kategorie „Bazar").</strong> U zboží prodávaného jako použité si prodávající
        a kupující v souladu s § 2168 občanského zákoníku ujednávají zkrácení doby pro vytknutí vady podle odst. 8.3 na
        1 rok od převzetí. Prodávající dále neodpovídá za vady odpovídající míře používání nebo opotřebení, kterou
        zboží mělo při převzetí kupujícím a na kterou byl kupující v popisu zboží upozorněn. U použitého zboží může být
        kupní cena přiměřeně snížena právě s ohledem na tento stav.
      </P>
      <P>8.8 <strong>Kdy práva z vadného plnění nevznikají.</strong> Práva z vadného plnění kupujícímu nenáleží, pokud vadu způsobil sám, zejména:</P>
      <UL>
        <li>běžným opotřebením (pláště, duše, brzdové destičky a špalky, řetěz, kazeta, převodníky, lanka a bovdeny, gripy, omotávka, ložiska při zanedbané údržbě, degradace kapacity baterie v rámci deklarovaných hodnot);</li>
        <li>nesprávnou montáží, seřízením nebo instalací provedenou kupujícím nebo třetí osobou;</li>
        <li>neodbornými zásahy, úpravami rámu či komponentů;</li>
        <li>nedodržením pokynů výrobce k údržbě, servisním intervalům a doporučenému rozsahu použití (např. použití krosového kola k sjezdovému ježdění, překročení maximální nosnosti);</li>
        <li>mechanickým poškozením, pádem, nehodou, korozí v důsledku zanedbané péče;</li>
        <li>u elektrokol nesprávným nabíjením, skladováním baterie v mrazu nebo její hlubokou trvalou vybitostí.</li>
      </UL>
      <P>
        8.9 <strong>Předávací servisní prohlídka.</strong> Prodávající doporučuje absolvovat po 150–300 km (cca
        1 měsíci) provozu záběhovou servisní prohlídku (dotažení, doseřízení lanek a výpletů). Neabsolvování prohlídky
        nemá vliv na zákonná práva kupujícího z vadného plnění; může však být zohledněno při posuzování, zda vada
        vznikla nesprávnou údržbou.
      </P>
      <P>
        8.10 <strong>Záruka za jakost.</strong> Poskytne-li prodávající nebo výrobce nad rámec zákonných práv záruku za
        jakost (např. prodloužená záruka na rám), je její rozsah a doba uvedena v záručním listu, na obalu, v reklamě
        nebo v popisu zboží. Zárukou nejsou dotčena zákonná práva kupujícího z vadného plnění.
      </P>

      <H2>9. Reklamační řád</H2>
      <P>
        9.1 Kupující uplatní reklamaci u prodávajícího na adrese {prodavajici.adresaProVraceni} nebo e-mailem na{" "}
        <a className="text-primary hover:underline" href={prodavajici.emailHref}>{prodavajici.email}</a>. Prodávající
        doporučuje uvést číslo objednávky, popis vady a preferovaný způsob vyřízení.
      </P>
      <P>
        9.2 Prodávající vydá kupujícímu písemné potvrzení o uplatnění reklamace, ve kterém uvede datum uplatnění, obsah
        reklamace, požadovaný způsob vyřízení a kontaktní údaje kupujícího (§ 19 odst. 1 zákona o ochraně spotřebitele).
      </P>
      <P>
        9.3 Je-li kupujícím spotřebitel, prodávající o reklamaci rozhodne ihned, ve složitých případech do 3 pracovních
        dnů. Reklamaci včetně odstranění vady vyřídí nejpozději do 30 dnů ode dne jejího uplatnění, nedohodne-li se
        s kupujícím na delší lhůtě. Marné uplynutí této lhůty se považuje za podstatné porušení smlouvy a spotřebitel
        je oprávněn od smlouvy odstoupit nebo požadovat přiměřenou slevu (§ 19 odst. 3 zákona o ochraně spotřebitele).
      </P>
      <P>
        9.4 Prodávající vydá kupujícímu potvrzení o datu a způsobu vyřízení reklamace, včetně potvrzení o provedení
        opravy a době jejího trvání, případně písemné odůvodnění zamítnutí reklamace.
      </P>
      <P>
        9.5 Kupující má právo na úhradu účelně vynaložených nákladů spojených s uplatněním oprávněné reklamace. Tyto
        náklady je třeba uplatnit do jednoho měsíce po uplynutí lhůty pro vytknutí vady.
      </P>
      <P>
        9.6 Reklamované zboží by mělo být předáno kompletní a přiměřeně čisté. Prodávající je oprávněn odmítnout
        převzetí zboží, které je znečištěno v rozporu s obecnými hygienickými zásadami.
      </P>

      <H2>10. Doručování a komunikace</H2>
      <P>
        10.1 Smluvní strany si mohou doručovat běžnou písemnou korespondenci elektronickou poštou, a to na e-mailovou
        adresu uvedenou v uživatelském účtu nebo v objednávce kupujícího, resp. na e-mailovou adresu prodávajícího
        uvedenou v čl. 1.2.
      </P>
      <P>
        10.2 Zpráva je doručena okamžikem jejího přijetí na server příchozí pošty. Za doručenou se považuje i zpráva,
        jejíž přijetí adresát odmítl nebo jejíž doručení zmařil.
      </P>
      {prodavajici.datovaSchranka && (
        <P>
          10.3 Kupující může prodávajícímu doručovat rovněž do datové schránky ID {prodavajici.datovaSchranka}.
        </P>
      )}

      <H2>11. Obchodní sdělení</H2>
      <P>
        11.1 Prodávající je oprávněn zasílat kupujícímu, který u něj zakoupil zboží, obchodní sdělení týkající se
        vlastních obdobných výrobků a služeb na e-mailovou adresu poskytnutou v souvislosti s nákupem, a to na základě
        § 7 odst. 3 zákona č. 480/2004 Sb., o některých službách informační společnosti.
      </P>
      <P>
        11.2 Kupující má právo zasílání obchodních sdělení kdykoli bezplatně odmítnout, a to jak při uzavření smlouvy,
        tak při zaslání každé jednotlivé zprávy (odkaz pro odhlášení v patičce e-mailu nebo zprávou na{" "}
        <a className="text-primary hover:underline" href={prodavajici.emailHref}>{prodavajici.email}</a>).
      </P>
      <P>
        11.3 Zasílání obchodních sdělení nad rámec odst. 11.1 (např. osobám, které u prodávajícího nenakoupily) probíhá
        výhradně na základě předchozího souhlasu.
      </P>

      <H2>12. Ochrana osobních údajů</H2>
      <P>
        12.1 Prodávající zpracovává osobní údaje kupujícího v souladu s nařízením Evropského parlamentu a Rady (EU)
        2016/679 (GDPR) a zákonem č. 110/2019 Sb., o zpracování osobních údajů.
      </P>
      <P>
        12.2 Podrobné informace o rozsahu, účelech, právních základech a době zpracování osobních údajů, jakož i
        o právech subjektu údajů, jsou uvedeny v dokumentu{" "}
        <Link to="/ochrana-osobnich-udaju" className="text-primary hover:underline">
          Zásady zpracování osobních údajů
        </Link>
        .
      </P>
      <P>
        12.3 Prodávající používá na svých webových stránkách soubory cookies. Cookies, které nejsou nezbytné pro
        fungování webu (zejména analytické a marketingové), jsou umísťovány pouze na základě předchozího souhlasu
        kupujícího podle § 89 odst. 3 zákona č. 127/2005 Sb., o elektronických komunikacích. Souhlas lze kdykoli
        odvolat prostřednictvím nastavení cookies na webu.
      </P>

      <H2>13. Mimosoudní řešení spotřebitelských sporů a dozor</H2>
      <P>13.1 K mimosoudnímu řešení spotřebitelských sporů z kupní smlouvy je příslušná:</P>
      <div className="mt-4 rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Česká obchodní inspekce</strong>
        <br />
        Ústřední inspektorát – oddělení ADR, Gorazdova 1969/24, 120 00 Praha 2
        <br />
        Web:{" "}
        <a className="text-primary hover:underline" href="https://adr.coi.cz" target="_blank" rel="noreferrer noopener">
          adr.coi.cz
        </a>{" "}
        · E-mail: <a className="text-primary hover:underline" href="mailto:adr@coi.cz">adr@coi.cz</a>
      </div>
      <P>
        Řízení lze zahájit na návrh spotřebitele, pokud se mu nepodařilo spor vyřešit přímo s prodávajícím. Návrh lze
        podat nejpozději do 1 roku ode dne, kdy spotřebitel uplatnil své právo u prodávajícího poprvé. Řízení je pro
        spotřebitele bezplatné.
      </P>
      <P>
        13.2 Dozor nad dodržováním povinností podle zákona č. 634/1992 Sb., o ochraně spotřebitele, vykonává Česká
        obchodní inspekce (www.coi.cz). Dozor v oblasti ochrany osobních údajů vykonává Úřad pro ochranu osobních údajů
        (www.uoou.cz). Živnostenskou kontrolu provádí příslušný živnostenský úřad.
      </P>
      <P>
        13.3 V případě přeshraničního sporu v rámci EU se spotřebitel může obrátit na Evropské spotřebitelské centrum
        ČR (www.evropskyspotrebitel.cz).
      </P>

      <H2>14. Závěrečná ustanovení</H2>
      <P>
        14.1 Je-li některé ustanovení obchodních podmínek neplatné nebo neúčinné, nastoupí namísto něj ustanovení,
        jehož smysl se neplatnému ustanovení co nejvíce přibližuje. Neplatností nebo neúčinností jednoho ustanovení
        není dotčena platnost ostatních ustanovení.
      </P>
      <P>
        14.2 Kupní smlouva včetně obchodních podmínek je archivována prodávajícím v elektronické podobě a není
        přístupná třetím osobám.
      </P>
      <P>
        14.3 Vztahuje-li se na smluvní vztah zahraniční prvek, řídí se vztah českým právem. Volbou práva podle tohoto
        ustanovení není spotřebitel zbaven ochrany, kterou mu poskytují ustanovení právního řádu státu jeho obvyklého
        bydliště, od nichž se nelze smluvně odchýlit.
      </P>
      <P>
        14.4 Tyto obchodní podmínky nabývají platnosti a účinnosti dne {prodavajici.ucinnostOd}
        {prodavajici.predchoziUcinnostOd
          ? ` a nahrazují předchozí znění účinné od ${prodavajici.predchoziUcinnostOd}.`
          : "."}
      </P>
      {prodavajici.predchudce && (
        <P>
          14.5 Přechodné ustanovení. Do {prodavajici.predchudce.doDne} provozoval e-shop cursorbike.cz{" "}
          {prodavajici.predchudce.jmeno}, IČO {prodavajici.predchudce.ico}. Kupní smlouvy uzavřené do tohoto dne se
          řídí zněním obchodních podmínek účinným ke dni odeslání objednávky.{" "}
          {prodavajici.predchudce.zavazkyPrevzaty
            ? `Práva a povinnosti z těchto smluv převzal prodávající; reklamace a odstoupení od smlouvy u zboží zakoupeného před uvedeným dnem proto kupující uplatňuje u prodávajícího podle čl. 1.2, a to na stejné adrese i stejným postupem.`
            : `Práva a povinnosti z těchto smluv nadále náleží ${prodavajici.predchudce.jmeno}, IČO ${prodavajici.predchudce.ico}; reklamace a odstoupení od smlouvy u zboží zakoupeného před uvedeným dnem je proto třeba uplatnit u něj. Prodávající kupujícímu s uplatněním rád pomůže.`}
        </P>
      )}

      <div className="mt-12 rounded-lg border bg-card p-6 shadow-card">
        <h2 className="section-title text-lg">Příloha č. 1 – Vzorový formulář pro odstoupení od smlouvy</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Formulář i celý postup najdete na stránce{" "}
          <Link to="/odstoupeni-od-smlouvy" className="text-primary hover:underline">
            Odstoupení od smlouvy
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
