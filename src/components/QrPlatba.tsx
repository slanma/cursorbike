import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { formatIban, spayd, type UdajePlatby } from "@/lib/platba";
import { formatCena } from "@/lib/produkty";

/**
 * QR kód k zaplacení objednávky.
 *
 * Zákazník ho načte v bankovní aplikaci a má předvyplněný příkaz — částku,
 * účet i variabilní symbol. Pod kódem jsou vždycky i vypsané údaje, protože
 * ne každý QR platby používá a v mobilní bance je občas nenajde.
 */
export function QrPlatba({
  platba,
  castka,
  cisloObjednavky,
}: {
  platba: UdajePlatby;
  castka: number;
  cisloObjednavky: number | string;
}) {
  const [obrazek, setObrazek] = useState<string | null>(null);
  const [chyba, setChyba] = useState(false);

  const iban = platba.iban;
  const splatnost = new Date();
  splatnost.setDate(splatnost.getDate() + (platba.splatnost_dni || 7));

  useEffect(() => {
    if (!iban) return;
    const text = spayd({
      iban,
      castka,
      variabilniSymbol: cisloObjednavky,
      zprava: `Objednavka ${cisloObjednavky} Cursorbike`,
      ...(platba.jmeno_prijemce ? { prijemce: platba.jmeno_prijemce } : {}),
      splatnost,
    });
    QRCode.toDataURL(text, { width: 320, margin: 1, errorCorrectionLevel: "M" })
      .then(setObrazek)
      .catch(() => setChyba(true));
    // Datum splatnosti se počítá při každém vykreslení, do závislostí nepatří.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iban, castka, cisloObjednavky, platba.jmeno_prijemce]);

  if (!iban) {
    return (
      <p className="rounded-md border bg-surface p-4 text-sm text-muted-foreground">
        Platební údaje zatím nejsou vyplněné. Doplňte je v administraci v sekci Nastavení.
      </p>
    );
  }

  return (
    <div className="grid gap-5 rounded-lg border bg-card p-6 shadow-card sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="mx-auto">
        {obrazek ? (
          <img src={obrazek} alt={`QR kód k zaplacení objednávky ${cisloObjednavky}`} width={200} height={200} />
        ) : (
          <div className="flex h-[200px] w-[200px] items-center justify-center rounded border text-sm text-muted-foreground">
            {chyba ? "QR kód se nepodařilo vytvořit" : "Připravuji QR kód…"}
          </div>
        )}
      </div>

      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-4 border-b pb-2">
          <dt className="text-muted-foreground">Částka</dt>
          <dd className="text-lg font-bold">{formatCena(castka)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Účet</dt>
          <dd className="font-semibold">{platba.ucet || formatIban(iban)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Variabilní symbol</dt>
          <dd className="font-semibold">{cisloObjednavky}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Splatnost</dt>
          <dd>{splatnost.toLocaleDateString("cs-CZ")}</dd>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Načtěte QR kód v bankovní aplikaci, nebo částku pošlete ručně podle údajů výše.
          Nezapomeňte na variabilní symbol, ať platbu poznáme.
        </p>
      </dl>
    </div>
  );
}
