/** 1 kolo, 2 kola, 5 kol — čeština chce u čísel tři tvary. */
export function sklonuj(n: number, jedno: string, dve: string, pet: string) {
  return `${n} ${n === 1 ? jedno : n >= 2 && n <= 4 ? dve : pet}`;
}
