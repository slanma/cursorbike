/**
 * Čtení feedů od dodavatelů.
 *
 * Každý dodavatel posílá data jinak, proto tu není jeden univerzální parser,
 * ale jeden na formát. Oba vracejí stejný tvar (`FeedProdukt`), takže zbytek
 * importu už je společný.
 *
 * Společná pravidla:
 *  - jedna barva = jeden produkt (tak jsme se dohodli, ať se nemusí přepínat
 *    barva v detailu a čekat na překlopení fotky)
 *  - velikosti rámu jsou varianty uvnitř produktu
 *  - ceny se ukládají jako „cena od dodavatele" a na web se samy nepropíšou
 */

export type Dodavatel = "crussis" | "author" | "cursorbike";

export type FeedVarianta = {
  velikost: string | null;
  ean: string | null;
  /** Cena včetně DPH, v celých korunách. */
  cena: number;
  skladem: number;
};

export type FeedProdukt = {
  dodavatel: Dodavatel;
  /** Kód u dodavatele — podle něj se produkt při dalším importu najde. */
  kod: string;
  nazev: string;
  barva: string | null;
  /** Kategorie tak, jak ji píše dodavatel. Přiřazení na naši kategorii řeší uživatel. */
  kategorieFeed: string;
  kratky: string;
  popis: string;
  /** Fotky s celou adresou — dají se rovnou stáhnout. */
  obrazky: string[];
  /** Fotky, u kterých feed uvádí jen název souboru (Author) — zatím nepoužitelné. */
  obrazkySoubory: string[];
  varianty: FeedVarianta[];
};

export type Upozorneni = { druh: string; produkt: string; detail: string };

export type FeedVysledek = {
  dodavatel: Dodavatel;
  produkty: FeedProdukt[];
  upozorneni: Upozorneni[];
  /** Kolik řádků / položek feed obsahoval, než se seskupily. */
  polozekVeFeedu: number;
};

/** Cena, u které dodavatel značí „cenu zatím neurčujeme". */
const CENA_NEURCENA = 99999;

const cislo = (s: string | null | undefined): number => {
  const n = Number(String(s ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
};

const ocisti = (s: string | null | undefined) => String(s ?? "").trim();

/** Z názvu utrhne velikost rámu na konci: „… (16)" nebo „… (XL)". */
export function oddelVelikost(nazev: string): { nazev: string; velikost: string | null } {
  const m = nazev.match(/^(.*)\s*\(([^()]{1,6})\)\s*$/);
  if (!m) return { nazev: nazev.trim(), velikost: null };
  const uvnitr = m[2]!.trim();
  const jeVelikost = /^\d{1,2}([",″']|palc\w*)?$/i.test(uvnitr) || /^(XXS|XS|S|M|L|XL|XXL|XXXL)$/i.test(uvnitr);
  return jeVelikost ? { nazev: m[1]!.trim(), velikost: uvnitr } : { nazev: nazev.trim(), velikost: null };
}

// =====================================================================
// CSV (PrestaShop export — Crussis)
// =====================================================================

/** Rozdělí CSV na řádky a buňky. Zvládá uvozovky i konce řádků uvnitř textu. */
export function rozdelCsv(text: string, oddelovac = ";"): string[][] {
  const radky: string[][] = [];
  let radek: string[] = [];
  let bunka = "";
  let vUvozovkach = false;

  for (let i = 0; i < text.length; i++) {
    const z = text[i]!;
    if (vUvozovkach) {
      if (z === '"') {
        if (text[i + 1] === '"') {
          bunka += '"';
          i++;
        } else vUvozovkach = false;
      } else bunka += z;
      continue;
    }
    if (z === '"') vUvozovkach = true;
    else if (z === oddelovac) {
      radek.push(bunka);
      bunka = "";
    } else if (z === "\n") {
      radek.push(bunka);
      radky.push(radek);
      radek = [];
      bunka = "";
    } else if (z !== "\r") bunka += z;
  }
  if (bunka || radek.length) {
    radek.push(bunka);
    radky.push(radek);
  }
  return radky.filter((r) => r.some((b) => b.trim() !== ""));
}

export function nactiCrussisCsv(text: string): FeedVysledek {
  const radky = rozdelCsv(text.replace(/^\uFEFF/, ""));
  if (!radky.length) throw new Error("Soubor je prázdný nebo se nepodařilo přečíst.");

  const hlavicka = radky[0]!.map((h) => h.trim());
  const idx = (nazev: string) => hlavicka.indexOf(nazev);
  const iName = idx("Name");
  const iPrice = idx("Price tax excluded");
  if (iName === -1 || iPrice === -1) {
    throw new Error('Tohle nevypadá jako export z PrestaShopu — chybí sloupce "Name" nebo "Price tax excluded".');
  }
  const iRef = idx("Reference");
  const iKat = idx("Categories");
  const iMnozstvi = idx("Quantity");
  const iVyrobce = idx("Manufacturer");
  const iEan = idx("EAN13");
  const iKratky = idx("Short description");
  const iPopis = idx("Description");
  const iFoto = idx("Image URLs");
  const iAktivni = idx("Active");

  const upozorneni: Upozorneni[] = [];
  const mapa = new Map<string, FeedProdukt>();

  for (const r of radky.slice(1)) {
    const bunka = (i: number) => (i >= 0 ? ocisti(r[i]) : "");
    const celyNazev = bunka(iName);
    if (!celyNazev) continue;
    if (iAktivni >= 0 && bunka(iAktivni) === "0") continue;

    const { nazev, velikost } = oddelVelikost(celyNazev);
    const kategorie = bunka(iKat).split("|").map((x) => x.trim()).filter(Boolean);
    const kod = `${bunka(iVyrobce) || "crussis"}-${nazev}`.toLowerCase();

    // Ceny v PrestaShop exportu jsou BEZ DPH. Feed sazbu neuvádí, u kol je 21 %.
    const cena = Math.round(cislo(bunka(iPrice)) * 1.21);
    if (cena <= 0) {
      upozorneni.push({ druh: "bez-ceny", produkt: celyNazev, detail: "Dodavatel neposlal cenu." });
    }

    const ean = bunka(iEan) || null;
    if (!ean) upozorneni.push({ druh: "bez-eanu", produkt: celyNazev, detail: "Chybí čárový kód." });

    let p = mapa.get(kod);
    if (!p) {
      const obrazky = bunka(iFoto).split(",").map((x) => x.trim()).filter(Boolean);
      if (!obrazky.length) {
        upozorneni.push({ druh: "bez-fotky", produkt: nazev, detail: "Feed neuvádí žádnou fotku." });
      }
      p = {
        dodavatel: "crussis",
        kod,
        nazev,
        barva: null,
        kategorieFeed: kategorie[kategorie.length - 1] || "",
        kratky: bunka(iKratky),
        popis: bunka(iPopis),
        obrazky,
        obrazkySoubory: [],
        varianty: [],
      };
      mapa.set(kod, p);
    }

    p.varianty.push({ velikost, ean, cena, skladem: Math.max(0, Math.round(cislo(bunka(iMnozstvi)))) });
  }

  const produkty = [...mapa.values()];
  for (const p of produkty) {
    if (p.varianty.every((v) => v.skladem === 0)) {
      upozorneni.push({ druh: "nulovy-sklad", produkt: p.nazev, detail: "Feed hlásí nula kusů u všech velikostí." });
    }
  }

  return { dodavatel: "crussis", produkty, upozorneni, polozekVeFeedu: radky.length - 1 };
}

// =====================================================================
// XML (Author, formát SHOP v3)
// =====================================================================

/** Z názvu varianty vytáhne velikost rámu: „Solution 2026 17\" bronzová…" → 17". */
export function velikostZNazvu(itemName: string, nazevModelu: string): string | null {
  const zbytek = itemName.replace(nazevModelu, " ");
  const m = zbytek.match(/(\d{2}(?:[,.]\d)?)\s*["″]/) || zbytek.match(/\b(XXS|XS|S|M|L|XL|XXL)\b/);
  return m ? m[1]!.replace(".", ",") + (m[0]!.includes('"') || m[0]!.includes("″") ? '"' : "") : null;
}

function textTagu(rodic: Element, tag: string): string {
  const e = rodic.getElementsByTagName(tag);
  for (let i = 0; i < e.length; i++) {
    if (e[i]!.parentNode === rodic) return ocisti(e[i]!.textContent);
  }
  return "";
}

function primePotomky(rodic: Element, tag: string): Element[] {
  const ven: Element[] = [];
  const deti = rodic.childNodes;
  for (let i = 0; i < deti.length; i++) {
    const d = deti[i] as Element;
    if (d.nodeType === 1 && d.nodeName === tag) ven.push(d);
  }
  return ven;
}

export function nactiAuthorXml(xml: string): FeedVysledek {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    throw new Error("Soubor se nepodařilo přečíst — nevypadá jako platné XML.");
  }
  const shop = doc.getElementsByTagName("SHOP")[0];
  if (!shop) throw new Error("Tohle nevypadá jako feed od Authora — chybí hlavní část SHOP.");

  // Číselník kategorií: ID položky → název („mtb 29", „junior 20", „e-cross 29")
  const nazvyKategorii = new Map<string, string>();
  const listItems = doc.getElementsByTagName("ListItem");
  for (let i = 0; i < listItems.length; i++) {
    const li = listItems[i]!;
    if (textTagu(li, "ID_Lists") !== "12") continue;
    const hodnota = textTagu(li, "ValueString");
    if (hodnota) nazvyKategorii.set(textTagu(li, "ID"), hodnota);
  }

  const upozorneni: Upozorneni[] = [];
  const produkty: FeedProdukt[] = [];
  const shopItems = doc.getElementsByTagName("ShopItem");
  let polozek = 0;

  for (let i = 0; i < shopItems.length; i++) {
    const it = shopItems[i]!;
    polozek++;
    // KO = kola, DI = díly. Díly zatím neimportujeme.
    if (textTagu(it, "BasicKind") !== "KO") continue;

    const nazevModelu = ocisti(textTagu(it, "ProductItemName"));
    if (!nazevModelu) continue;

    const kategorie = primePotomky(it, "Categories")
      .flatMap((c) => primePotomky(c, "Category"))
      .map((c) => nazvyKategorii.get(textTagu(c, "ID_Lists")))
      .filter((x): x is string => Boolean(x))
      .filter((x) => !/^Akce/i.test(x));
    const kategorieFeed = [...new Set(kategorie)][0] ?? "";
    if (!kategorieFeed) {
      upozorneni.push({ druh: "bez-kategorie", produkt: nazevModelu, detail: "Feed neuvádí, o jaký typ kola jde." });
    }

    const popis = ocisti(textTagu(it, "Description")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    for (const ci of it.getElementsByTagName("ColorItem")) {
      const kod = textTagu(ci, "ColorItemNo");
      if (!kod) continue;
      const barva = textTagu(ci, "ColorFull") || null;

      const soubory = [textTagu(ci, "Image")].filter(Boolean);
      for (const af of ci.getElementsByTagName("AddFile")) {
        if (textTagu(af, "AddFileType").toLowerCase() !== "jpg") continue;
        const nazevSouboru = textTagu(af, "AddFileLink");
        // Rozměrové tabulky nejsou fotky kola, do galerie nepatří.
        if (nazevSouboru && !/size|tabulka|geometri/i.test(nazevSouboru)) soubory.push(nazevSouboru);
      }

      const varianty: FeedVarianta[] = [];
      for (const si of ci.getElementsByTagName("SizeItem")) {
        const cena = Math.round(cislo(textTagu(si, "Price_VAT")));
        const itemName = textTagu(si, "ItemName");
        if (cena >= CENA_NEURCENA) {
          upozorneni.push({
            druh: "bez-ceny",
            produkt: `${nazevModelu}${barva ? " — " + barva : ""}`,
            detail: `Varianta „${itemName}" nemá cenu (dodavatel posílá 99999).`,
          });
          continue;
        }
        const ean = textTagu(si, "EAN") || null;
        if (!ean) {
          upozorneni.push({ druh: "bez-eanu", produkt: itemName || nazevModelu, detail: "Chybí čárový kód." });
        }
        varianty.push({
          velikost: velikostZNazvu(itemName, nazevModelu.replace(/^AUTHOR\s+/i, "")),
          ean,
          cena,
          skladem: Math.max(0, Math.round(cislo(textTagu(si, "Stock")))),
        });
      }

      if (!varianty.length) continue;

      produkty.push({
        dodavatel: "author",
        kod,
        nazev: nazevModelu,
        barva,
        kategorieFeed,
        kratky: popis.slice(0, 190),
        popis,
        obrazky: [],
        obrazkySoubory: [...new Set(soubory)],
        varianty,
      });
    }
  }

  for (const p of produkty) {
    if (!p.obrazkySoubory.length) {
      upozorneni.push({ druh: "bez-fotky", produkt: p.nazev, detail: "Feed neuvádí žádnou fotku." });
    }
  }

  return { dodavatel: "author", produkty, upozorneni, polozekVeFeedu: polozek };
}

// =====================================================================
// CSV export z administrace starého webu (PrestaShop → Katalog → Produkty)
//
// Zvláštnost: jeden řádek = jedna velikost rámu a jedna barva. Velikost
// i barva jsou schované v názvu, každá značka je píše jinak:
//   Author   „Context 2025 17" (29") stříbrná-matná/limeta Author MTB kolo"
//   Crussis  „e-Cross low 9.11-(715 Wh) (18)"  — velikost v závorce na konci
//   Lectron  „Lectron Montana MGX 17" – 25 Ah (900 Wh)"
//   Liberty  „LIBERTY VIA 26" 7spd NEXUS"      — 26" je velikost kola, ne rámu
// =====================================================================

/** Rozměry kol, které se nesmí splést s velikostí rámu. */
const ROZMERY_KOL = new Set(["24", "26", "27,5", "28", "29"]);

const BARVY = [
  "černá", "bílá", "stříbrná", "modrá", "červená", "zelená", "limeta", "růžová", "žlutá",
  "oranžová", "šedá", "titan", "zelenozlatá", "bronzová", "magenta", "fialová", "tyrkys",
  "khaki", "béžová", "zlatá", "písková", "antracit",
];

/** Z názvu řádku oddělí velikost rámu, barvu a zbytek (název modelu). */
export function rozlozNazev(nazev: string, kategorie: string): {
  model: string;
  barva: string | null;
  velikost: string | null;
} {
  let n = nazev.split(/\s+/).join(" ").trim();
  let velikost: string | null = null;

  // 1) velikost v závorce na konci — Crussis, číselná i písmenná
  const naKonci = n.match(/\((\d{2}(?:,\d)?|XXS|XS|S|M|L|XL|XXL)\)\s*$/);
  if (naKonci) {
    velikost = naKonci[1]!;
    n = n.slice(0, naKonci.index).trim();
  } else {
    // 2) rozměr kola v závorce („(29\")") velikost rámu není
    n = n.replace(/\((\d{2}(?:,\d)?)["\u201d']\)/g, " ");
    // 3) u městských kol Liberty je palcový údaj rozměr kola, ne rámu
    if (!kategorie.includes("City")) {
      const re = /(?<![\d,])(\d{2}(?:,\d)?)["\u201d'](?!\w*kolo)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(n))) {
        if (ROZMERY_KOL.has(m[1]!) && !/\d{4}/.test(n.slice(0, m.index))) continue;
        velikost = m[1]!;
        n = n.slice(0, m.index) + " " + n.slice(m.index + m[0]!.length);
        break;
      }
    }
  }

  // 4) marketingový ocas („Author dámské MTB 29\"kolo") do názvu nepatří
  const bezOcasu = n.replace(/\s+(Author|AUTHOR)\s+(dámské|pánské|dětské)?\s*(MTB|krosové|E-kolo|trekové)?.*$/, " ");
  if (bezOcasu.trim()) n = bezOcasu;
  n = n.replace(/\s*\d{2}(?:,\d)?["\u201d']?\s*kolo\s*$/, " ");
  n = n.split(/\s+/).join(" ").trim().replace(/^[–-]+|[–-]+$/g, "").trim();

  // 5) barva = od prvního slova, které barvu obsahuje, až do konce
  const slova = n.split(" ");
  for (let i = 0; i < slova.length; i++) {
    const holy = slova[i]!.toLowerCase().replace(/["–-]/g, "");
    if (BARVY.some((b) => holy.includes(b))) {
      return { model: slova.slice(0, i).join(" ").trim(), barva: slova.slice(i).join(" ").trim(), velikost };
    }
  }
  return { model: n, barva: null, velikost };
}

export function nactiCursorbikeExport(text: string): FeedVysledek {
  const radky = rozdelCsv(text.replace(/^\uFEFF/, ""));
  if (!radky.length) throw new Error("Soubor je prázdný nebo se nepodařilo přečíst.");

  const hlavicka = radky[0]!.map((h) => h.trim().replace(/^"|"$/g, ""));
  const idx = (n: string) => hlavicka.indexOf(n);
  const iNazev = idx("Název");
  const iCena = idx("Cena (s DPH)");
  if (iNazev === -1 || iCena === -1) {
    throw new Error('Tohle nevypadá jako export z administrace — chybí sloupce "Název" nebo "Cena (s DPH)".');
  }
  const iId = idx("Product ID");
  const iFoto = idx("Obrázek");
  const iKat = idx("Kategorie");
  const iPocet = idx("Počet");

  const upozorneni: Upozorneni[] = [];
  const mapa = new Map<string, FeedProdukt>();
  const videnaId = new Set<string>();

  for (const r of radky.slice(1)) {
    const b = (i: number) => (i >= 0 ? ocisti(r[i]) : "");
    const nazev = b(iNazev);
    if (!nazev) continue;

    // Stejný produkt může být ve dvou exportech, brát ho chceme jednou.
    const id = b(iId);
    if (id) {
      if (videnaId.has(id)) continue;
      videnaId.add(id);
    }

    const kategorie = b(iKat);
    if (!kategorie) {
      upozorneni.push({ druh: "bez-kategorie", produkt: nazev, detail: "V exportu chybí kategorie." });
    }

    const { model, barva, velikost } = rozlozNazev(nazev, kategorie);
    const kod = `${kategorie}|${model}|${barva ?? ""}`.toLowerCase();
    const cena = Math.round(cislo(b(iCena)));
    if (cena <= 0) upozorneni.push({ druh: "bez-ceny", produkt: nazev, detail: "Řádek nemá cenu." });

    const foto = b(iFoto);
    if (!foto) upozorneni.push({ druh: "bez-fotky", produkt: nazev, detail: "Řádek nemá fotku." });

    let p = mapa.get(kod);
    if (!p) {
      p = {
        dodavatel: "cursorbike",
        kod,
        nazev: model || nazev,
        barva,
        kategorieFeed: kategorie,
        kratky: "",
        popis: "",
        obrazky: foto ? [foto] : [],
        obrazkySoubory: [],
        varianty: [],
      };
      mapa.set(kod, p);
    } else if (foto && !p.obrazky.includes(foto)) {
      p.obrazky.push(foto);
    }

    p.varianty.push({ velikost, ean: null, cena, skladem: Math.max(0, Math.round(cislo(b(iPocet)))) });
  }

  return {
    dodavatel: "cursorbike",
    produkty: [...mapa.values()],
    upozorneni,
    polozekVeFeedu: radky.length - 1,
  };
}

// =====================================================================
// Rozpoznání formátu
// =====================================================================

export function nactiFeed(nazevSouboru: string, obsah: string): FeedVysledek {
  const zacatek = obsah.slice(0, 400);
  if (zacatek.trimStart().startsWith("<?xml") || zacatek.includes("<SHOP")) return nactiAuthorXml(obsah);
  if (/Product ID|Cena \(s DPH\)/.test(zacatek)) return nactiCursorbikeExport(obsah);
  if (/Reference\s*;|Name\s*;|;\s*EAN13/.test(zacatek)) return nactiCrussisCsv(obsah);
  throw new Error(
    `Soubor „${nazevSouboru}" se nepodařilo rozpoznat. Podporujeme XML feed od Authora, CSV export z PrestaShopu a CSV export z administrace starého webu.`,
  );
}

/** Souhrn upozornění po druzích, pro přehled „co dodělat". */
export function shrnUpozorneni(upozorneni: Upozorneni[]): { druh: string; popis: string; pocet: number }[] {
  const popisy: Record<string, string> = {
    "bez-ceny": "bez ceny — dodavatel ji neposlal",
    "bez-fotky": "bez fotky",
    "bez-eanu": "bez čárového kódu — nejdou spolehlivě spárovat",
    "bez-kategorie": "bez kategorie — nevíme, kam patří",
    "nulovy-sklad": "nula kusů skladem u všech velikostí",
  };
  const mapa = new Map<string, number>();
  for (const u of upozorneni) mapa.set(u.druh, (mapa.get(u.druh) ?? 0) + 1);
  return [...mapa.entries()]
    .map(([druh, pocet]) => ({ druh, popis: popisy[druh] ?? druh, pocet }))
    .sort((a, b) => b.pocet - a.pocet);
}
