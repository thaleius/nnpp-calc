import { getConstants } from "./api";

const [C1, C2] = await getConstants();
const T0 = 323;
const T1 = 370;
const T2 = 423;
const P0 = 101.3;

export function FR(T: number, FRV: number) {
  return FRV/1000 * (pressure(T) - P0)**(1/2);
}

export function FRV(T: number, FR: number) {
  return T > T1 ? (1000*FR / (pressure(T) - P0)**(1/2)) : 0;
}

export function T(FRV: number, FR: number) {
  return (1000*FR/FRV)**2 / C1 + T0;
}

export function pressure(T: number) {
  return (T > T1 ? T > T2 ? (C1 * (T-T0)) : (C1*C2 * (T-T1)**2) : 0) + P0;
}

export function power(FR: number) {
  return FR > 3.61 ? 5499 * (FR-3.61) : 0;
}

export function FR_power(power: number) {
  return power/5499+3.61;
}