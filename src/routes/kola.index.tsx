import { createFileRoute } from "@tanstack/react-router";
import { ZnackyPrehled } from "@/components/ZnackyPrehled";

export const Route = createFileRoute("/kola/")({
  head: () => ({
    meta: [
      { title: "Jízdní kola — Author a Liberty | Cursorbike" },
      {
        name: "description",
        content: "Vyberte značku: Author (pánská, dámská, dětská) nebo Liberty City 26\". Kola skladem v Kravařích.",
      },
      { property: "og:title", content: "Jízdní kola | Cursorbike" },
      { property: "og:description", content: "Jednoduchý výběr kol podle značky a kategorie." },
    ],
  }),
  component: () => (
    <ZnackyPrehled
      kategorie="kola"
      nadpis="Jízdní kola"
      perex="Klikněte na značku a vyberte kategorii — pánská, dámská, dětská nebo městská. Každé kolo předáváme kompletně seřízené."
    />
  ),
});
