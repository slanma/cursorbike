# Plán: Srozumitelnost navigace pro běžné zákazníky (60+)

Cíl: ať i nezkušený zákazník (60letý, který nezná značky) dokáže bez zmatku dojít od lišty ke konkrétnímu kolu. Strukturu (Kola → značka → kategorie → kolo) ponechávám, doplňuji orientaci a nápovědu.

## 1. Drobečková navigace (kde právě jsem)

Nový sdílený komponent `src/components/Drobky.tsx` — jednoduchý řádek odkazů oddělených „›", barevně tlumený, aktivní krok zvýrazněn.

Použití:
- `/kola` → `Kola`
- `/kola/$znacka` → `Kola › Author`
- `/elektrokola` → `Elektrokola`
- `/elektrokola/$znacka` → `Elektrokola › Crussis`
- `/kolo/$slug` → `Kola › Author › <název kola>` (značku odvodím z produktu)
- `/bazar` → `Bazar`

Vloží se hned pod záhlavím na každé výše uvedené stránce, nad hlavním nadpisem.

## 2. Nápovědný box „Jak vybrat" na přehledech značek

Do `ZnackyPrehled.tsx` (stránky `/kola` i `/elektrokola`) nad karty značek přidám krátký, lidsky psaný tip:

> **Nevíte, kterou značku?** Většina lidí vybírá podle toho, kdo na kolo pojede.
> Klikněte na značku a pak vlevo nahoře zvolte Pánská / Dámská / Dětská.
> Nejste si jistí? Zavolejte nám — rádi poradíme.

Tím se 60letý uživatel hned dozví, jak systém funguje, aniž by musel hádat.

## 3. Štítky „Oblíbené" na kartách produktů

Do `Produkt` v `src/lib/produkty.ts` přidám volitelné pole `oblibene?: boolean` a označím 2–3 produkty (typicky ty s nejlepším poměrem cena/výbava). V `ProductCard.tsx` se zobrazí zelený štítek „Oblíbené" vedle existujícího „Akce". Důvod: začínajícímu zákazníkovi to dá jasný výchozí tip („tohle lidé berou nejvík").

## 4. Zvětšení a kontrast tlačítek filtru

V `ZnackaVypis.tsx` mírně zvětším tlačítka kategorií (větší padding, výraznější aktivní stav) — lepší pro neobratnější prsty. Stávající styl ponechám, jen upravím velikost/contrast.

## Co se nemění
- Pořadí v liště, rozdělení značek, cesta kola→značka→kategorie, barvy ani obsah stránek Servis/Kontakt/O mně.

## Soubory
- Nový: `src/components/Drobky.tsx`
- Uprava: `src/lib/produkty.ts` (pole `oblibene` + označení produktů)
- Uprava: `src/components/ZnackyPrehled.tsx` (nápovědný box)
- Uprava: `src/components/ZnackaVypis.tsx` (drobky + větší tlačítka)
- Uprava: `src/components/ProductCard.tsx` (štítek Oblíbené)
- Uprava: `src/routes/kolo.$slug.tsx`, `kola.index.tsx`, `kola.$znacka.tsx`, `elektrokola.index.tsx`, `elektrokola.$znacka.tsx`, `bazar.tsx` (vložení drobků)
