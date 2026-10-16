import { createFileRoute } from "@tanstack/react-router";
import { ZnackyPrehled } from "@/components/ZnackyPrehled";

export const Route = createFileRoute("/doplnky/")({
  head: () => ({
    meta: [
      { title: "Doplňky a díly | Cursorbike" },
      { name: "description", content: "Díly, doplňky a vybavení ke kolům v prodejně Cursorbike v Kravařích." },
      { property: "og:title", content: "Doplňky a díly | Cursorbike" },
    ],
  }),
  component: () => (
    <ZnackyPrehled
      kategorie="doplnky"
      nadpis="Doplňky a díly"
      perex="Vyberte značku a pak typ zboží. Když si nejste jistí, co se ke kolu hodí, zavolejte nám."
    />
  ),
});
