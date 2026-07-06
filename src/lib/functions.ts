import { getConstants } from "./api";

const [C1, C2] = await getConstants();
const T0 = 323;
const T1 = 370;

export function FR(T: number, FRV: number) {
  return FRV/C1 * (T > 425 ? (T-T0)**(1/2) : T > 370 ? ((T-T1)/C2) : 0);
}

export function FRV(T: number, FR: number) {
  return T > 370 ? (C1 * FR / (T > 425 ? (T-T0)**(1/2) : ((T-T1)/C2))) : 0;
}

export function T(FRV: number, FR: number) {
  return (C1*FR/FRV)**2 + T0;
}

export function output(FR: number) {
  return FR > 3.61 ? 5499 * (FR-3.61) : 0;
}

export function FR_power(power: number) {
  return power/5499+3.61;
}