import { createFileRoute } from "@tanstack/react-router";
import { ZnackyPrehled } from "@/components/ZnackyPrehled";

export const Route = createFileRoute("/elektrokola/")({
  head: () => ({
    meta: [
      { title: "Elektrokola — Author, Crussis, eMERIX, Liberty, Lectron | Cursorbike" },
      {
        name: "description",
        content: "Elektrokola podle značky: Author, Crussis, eMERIX, Liberty a Lectron. Servis i repase baterií v Kravařích.",
      },
      { property: "og:title", content: "Elektrokola | Cursorbike" },
      { property: "og:description", content: "Vyberte značku elektrokola a hned uvidíte, co potřebujete." },
    ],
  }),
  component: () => (
    <ZnackyPrehled
      kategorie="elektrokola"
      nadpis="Elektrokola"
      perex="Klikněte na značku a vyberte typ — horská, treková, městská nebo dámská. Baterie repasujeme přímo u nás."
    />
  ),
});
