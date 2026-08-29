/**
 * Platba QR kódem.
 *
 * Používá se český standard SPAYD (Short Payment Descriptor) — ten umí načíst
 * každá česká bankovní aplikace. Zákazník kód vyfotí a má předvyplněný příkaz.
 * Nestojí to nic a nepotřebujeme platební bránu.
 *
 * SPAYD chce účet v podobě IBAN, ale obchodník zná svůj účet v české podobě
 * (`předčíslí-číslo/kód banky`), takže si ho převedeme sami.
 */

export type UdajePlatby = {
  ucet: string;
  banka: string;
  iban: string;
  splatnost_dni: number;
  jmeno_prijemce: string;
};

export const VYCHOZI_PLATBA: UdajePlatby = {
  ucet: "",
  banka: "",
  iban: "",
  splatnost_dni: 7,
  jmeno_prijemce: "",
};

/** Zbytek po dělení 97 pro dlouhá čísla — nevejdou se do běžného čísla. */
function modulo97(cislo: string): number {
  let zbytek = 0;
  for (const znak of cislo) zbytek = (zbytek * 10 + Number(znak)) % 97;
  return zbytek;
}

/**
 * Převede české číslo účtu na IBAN.
 *
 * Formát: `19-2000145399/0800` → `CZ6508000000192000145399`
 * Vrací null, když číslo účtu nedává smysl — radši nic než špatný QR kód.
 */
export function naIban(ucet: string): string | null {
  const ocisteny = ucet.replace(/\s/g, "");
  const shoda = ocisteny.match(/^(?:(\d{1,6})-)?(\d{1,10})\/(\d{4})$/);
  if (!shoda) return null;

  const predcisli = (shoda[1] ?? "").padStart(6, "0");
  const cislo = shoda[2]!.padStart(10, "0");
  const kodBanky = shoda[3]!;

  // Kontrolní číslice: přesuneme CZ00 na konec, písmena nahradíme čísly
  // (C = 12, Z = 35) a spočítáme 98 mínus zbytek po dělení 97.
  const zaklad = `${kodBanky}${predcisli}${cislo}123500`;
  const kontrola = String(98 - modulo97(zaklad)).padStart(2, "0");
  return `CZ${kontrola}${kodBanky}${predcisli}${cislo}`;
}

/** Hezky čitelný IBAN po čtveřicích, jen pro zobrazení. */
export const formatIban = (iban: string) => iban.replace(/(.{4})/g, "$1 ").trim();

/**
 * Sestaví text, který se zakóduje do QR kódu.
 * Diakritika se odstraňuje — banky ji v příkazech nepodporují spolehlivě.
 */
export function spayd(opts: {
  iban: string;
  castka: number;
  variabilniSymbol: string | number;
  zprava?: string;
  prijemce?: string;
  splatnost?: Date;
}): string {
  const bezDiakritiky = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9 .,\-_]/g, "")
      .trim()
      .slice(0, 35);

  const casti = [
    "SPD*1.0",
    `ACC:${opts.iban}`,
    `AM:${opts.castka.toFixed(2)}`,
    "CC:CZK",
    `X-VS:${opts.variabilniSymbol}`,
  ];
  if (opts.zprava) casti.push(`MSG:${bezDiakritiky(opts.zprava)}`);
  if (opts.prijemce) casti.push(`RN:${bezDiakritiky(opts.prijemce)}`);
  if (opts.splatnost) {
    const d = opts.splatnost;
    const den = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    casti.push(`DT:${den}`);
  }
  return casti.join("*");
}
