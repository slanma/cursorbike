import { createFileRoute, notFound } from "@tanstack/react-router";
import { ZnackaVypis } from "@/components/ZnackaVypis";
import { najdiZnacku, type Znacka } from "@/lib/produkty";

export const Route = createFileRoute("/kola/$znacka")({
  loader: ({ params }) => {
    const znacka = najdiZnacku("kola", params.znacka);
    if (!znacka) throw notFound();
    return { znacka };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Značka nenalezena | Cursorbike" }, { name: "robots", content: "noindex" }] };
    }
    const t = `${loaderData.znacka.nazev} jízdní kola | Cursorbike`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.znacka.popis },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.znacka.popis },
      ],
    };
  },
  component: KolaZnacka,
});

function KolaZnacka() {
  const { znacka } = Route.useLoaderData() as { znacka: Znacka };
  return <ZnackaVypis kategorie="kola" znacka={znacka} />;
}
