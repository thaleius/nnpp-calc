import { getConstants } from "./api";

const { C1, dC1, C3, dC3, C4, dC4, C5, dC5, C6, dC6 } = await getConstants();
const T0 = 323;
const T1 = 370;
const T2 = 423;
const P0 = 101.3;

const k = 2;
const dd = (n: number) => 10**(-n)/2;
export const dT = dd(1);
export const dExc = dd(0);
export const dFR = dd(2);
export const dFRV = dd(1);

export function FR(T: number, FRV: number) {
  return FRV/1000 * (pressure(T) - P0)**(1/2);
}

export function FR_unc(T: number, dT: number, FRV: number, dFRV: number) {
  return (
    (dFRV/1000 * (pressure(T) - P0)**(1/2))**2 +
    (FRV/1000/2*pressure_unc(T, dT))**2/(pressure(T) - P0)
  )**(1/2) * k
}

export function FRV(T: number, FR: number) {
  return T > T1 ? (1000*FR / (pressure(T) - P0)**(1/2)) : 0;
}

export function FRV_unc(T: number, dT: number, FR: number, dFR: number) {
  return (
    (1000*dFR / (pressure(T) - P0)**(1/2))**2 + (1000*FR/2 / (pressure(T) - P0)**(3/2) * pressure_unc(T, dT))**2
  )**(1/2) * k
}

export function T(FRV: number, FR: number) {
  return (1000*FR/FRV)**2 / C1 + T0;
}

export function T_unc(FRV: number, dFRV: number, FR: number, dFR: number) {
  return FRV === 0 ? 0 : (
    (2*1000**2*FR/FRV**2/C1 * dFR)**2 + (2*1000**2*FR**2/FRV**3/C1 * dFRV)**2 + ((1000*FR/FRV)**2 / C1**2 * dC1)**2
  )**(1/2) * k
}

export function pressure(T: number) {
  return (T > T1 ? T > T2 ? (C1 * (T-T0)) : (C1/28.09 * (T-T1)**2) : 0) + P0;
}

export function pressure_unc(T: number, dT: number) {
  return T > T1 ? T > T2 ? (
    ((T-T0)*dC1)**2 + (C1*dT)**2
  )**(1/2) * k : (
    (T-T1)**4*((dC1/28.09)**2) + (C1/28.09*2*(T-T1)*dT)**2
  )**(1/2) * k : 0
}

export function power(FR: number) {
  return FR > 3.61 ? C3 * (FR-3.61) : 0;
}

export function power_unc(dFR: number) {
  return C3*dFR;
}

export function FR_power(power: number) {
  return power/C3+3.61;
}

export function FR_power_unc(dpower: number) {
  return dpower/C3;
}

export function excess_unc(dFR1: number, dFR2: number) {
  return C3*(
    dFR1**2 + dFR2**2
  )**(1/2) * k
}

const fwPlateau = 2300;

export function fw_flow(T: number) {
  return T > 323 ? T > fwPlateau ? (fwPlateau-323)/C4 : (T-323)/C4 : 0;
}

export function fw_flow_unc(T: number, dT: number) {
  return T > 323 ? T > fwPlateau ? 0 : ((
    (dT/C4)**2 + ((T-323)/C4**2 * dC4)**2
  )**(1/2) * k) : 0
}

export function T_fwFlow(fwFlow: number) {
  return fwFlow < 0 ? 323 : fwFlow > fw_flow(fwPlateau) ? fwPlateau : C4*fwFlow + 323;
}

export function T_fwFlow_unc(fwFlow: number) {
  return fwFlow < 0 ? 0 : fwFlow > fw_flow(fwPlateau) ? 0 : (
    (dC4*fwFlow)**2
  )**(1/2) * k;
}

export function fw_util(fwFlow: number, single: boolean = false): number {
  return single ? 2*fw_util(fwFlow) : C5*fwFlow;
}

export function fw_util_unc(fwFlow: number, dfwFlow: number, single: boolean = false): number {
  return single ? 2*fw_util_unc(fwFlow, dfwFlow) : (
    (dC5*fwFlow)**2 + (C5*dfwFlow)**2
  )**(1/2) * k;
}

export function fw_flow_util(fwUtil: number, single: boolean = false): number {
  return single ? fw_flow_util(fwUtil)/2 : fwUtil/C5;
}

export function fw_flow_util_unc(fwUtil: number, dfwUtil: number, single: boolean = false):number {
  return single ? fw_flow_util_unc(fwUtil, dfwUtil)/2 : (
    (dfwUtil/C5)**2 + (fwUtil/C5**2 * dC5)**2
  )**(1/2) * k
}

const s = 9;
const u = 40;
const v = 8.777015329770778;
const dv = 0.0022;
const w = 6;

export function vibration(fr: number) {
  if (fr < s)
    return C6*fr**(1/2)
  
  return u*C6*(v-fr)/(w-fr);
}

export function vibration_unc(fr: number, dfr: number) {
  if (fr == 0) return 0;

  if (fr < s) {
    const df_C6 = fr**(1/2) * dC6;
    const df_fr = (C6 / (2 * fr**(1/2))) * dfr;
    return (df_C6**2 + df_fr**2)**(1/2) * k;
  }

  const df_C6 =  u*(v-fr)/(w-fr) * dC6;
  const df_v = u*C6/(w-fr) * dv;
  const df_fr = u*C6*(w-v)/(w-fr)**2 * dfr;

  return (df_C6**2 + df_v**2 + df_fr**2)**(1/2) * k;
}

export function rpm(fr: number) {
  return Math.max(900 * fr - 250, 0);
}

export function rpm_unc(dfr: number) {
  return 900 * dfr * k;
}