/**
 * Display currency for the running game (home city + era). The economy stays in studio dollars;
 * this only decides how an amount is *shown*. `Index` sets it before children render, so any
 * component can call `money(n)` without threading city and era props through.
 */
import { currencySymbol, formatMoney, toLocalAmount } from '@/rpg/cities';

let cityId: string | undefined;
let eraId: string | undefined;

export const setDisplayCurrency = (city?: string, era?: string): void => {
  cityId = city;
  eraId = era;
};

/** "£1,240" for studio dollars. */
export const money = (dollars: number): string => formatMoney(dollars, cityId, eraId);
/** Signed: "+£120" / "-£80". */
export const signedMoney = (dollars: number): string => `${dollars < 0 ? '-' : '+'}${formatMoney(Math.abs(dollars), cityId, eraId)}`;
export const moneySymbol = (): string => currencySymbol(cityId, eraId);
export const moneyValue = (dollars: number): number => toLocalAmount(dollars, cityId, eraId);
