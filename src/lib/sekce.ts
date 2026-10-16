import type { Kategorie } from "@/lib/produkty";

/** Názvy a adresy sekcí webu na jednom místě. */
export const SEKCE: Record<Kategorie, { nazev: string; cesta: "/kola" | "/elektrokola" | "/bazar" | "/doplnky" }> = {
  kola: { nazev: "Kola", cesta: "/kola" },
  elektrokola: { nazev: "Elektrokola", cesta: "/elektrokola" },
  bazar: { nazev: "Bazar", cesta: "/bazar" },
  doplnky: { nazev: "Doplňky", cesta: "/doplnky" },
};

export const nazevSekce = (sekce: string | null | undefined) =>
  SEKCE[(sekce ?? "kola") as Kategorie]?.nazev ?? "Kola";
