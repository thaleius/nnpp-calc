const C1 = 6.53421059705648;
const dFRV_dt_pp = 0.01;
const dFRV_dt_p = 0.005;
const change_speed = 0.05;
const tau = 0.06294111;
const alpha = 0.98584393;

function getFR(t: number, time_limit: number, valve_end_time: number, K: number): number {
    const t1 = change_speed;
    const t2 = time_limit;
    const t3 = time_limit + change_speed;
    const t4 = time_limit + 2 * change_speed;
    const t5 = time_limit + 3 * change_speed;
    const t6 = valve_end_time - change_speed;
    const t7 = valve_end_time;

    const v1 = dFRV_dt_p * K * t1;
    const v2 = v1 + dFRV_dt_pp * K * (t2 - t1);
    const v3 = v2 + dFRV_dt_p * K * (t3 - t2);
    const v4 = v3;
    const v5 = v4 - dFRV_dt_p * K * (t5 - t4);
    const v6 = v5 - dFRV_dt_pp * K * (t6 - t5);
    const v7 = v6 - dFRV_dt_p * K * (t7 - t6);

    if (t < t1) return dFRV_dt_p * K * t;
    if (t < t2) return v1 + dFRV_dt_pp * K * (t - t1);
    if (t < t3) return v2 + dFRV_dt_p * K * (t - t2);
    if (t < t4) return v3;
    if (t < t5) return v4 - dFRV_dt_p * K * (t - t4);
    if (t < t6) return v5 - dFRV_dt_pp * K * (t - t5);
    if (t < t7) return v6 - dFRV_dt_p * K * (t - t6);
    return v7;
}

function getS(fr: number): number {
    return fr > 250 / 900 ? 900 * fr - 250 : 0;
}

function get_dRPM(t: number, rpm: number, time_limit: number, valve_end_time: number, K: number): number {
    const s_val = getS(getFR(t, time_limit, valve_end_time, K));
    const diff = s_val - rpm;
    return tau * Math.sign(diff) * Math.pow(Math.abs(diff), alpha);
}

function getFRVState(t: number, time_limit: number, valve_end_time: number): string {
    const t1 = change_speed;
    const t2 = time_limit;
    const t3 = time_limit + change_speed;
    const t4 = time_limit + 2 * change_speed;
    const t5 = time_limit + 3 * change_speed;
    const t6 = valve_end_time - change_speed;
    const t7 = valve_end_time;

    if (t === 0) return '0';
    if (t < t1) return '+';
    if (t < t2) return '++';
    if (t < t3) return '+';
    if (t < t4) return '0';
    if (t < t5) return '-';
    if (t < t6) return '--';
    if (t < t7) return '-';
    return '0'
}

export function simulate(time_limit: number, valve_end_time: number, temp: number, sim_end_time: number, steps: number = 1000) {
    const K = Math.sqrt(C1 * (temp - 323)) / 10;
    const dt = sim_end_time / steps;

    const time = new Float64Array(steps + 1);
    const rpm = new Float64Array(steps + 1);
    const fr_vals = new Float64Array(steps + 1);
    const s_vals = new Float64Array(steps + 1);
    const drpm = new Float64Array(steps + 1);
    const frv_state = new Array(steps + 1);

    time[0] = 0;
    rpm[0] = 0;
    fr_vals[0] = getFR(0, time_limit, valve_end_time, K);
    s_vals[0] = getS(fr_vals[0]);
    drpm[0] = get_dRPM(0, 0, time_limit, valve_end_time, K);
    frv_state[0] = getFRVState(0, time_limit, valve_end_time);

    let max_rpm = 0;

    for (let i = 0; i < steps; i++) {
        const t_n = i * dt;
        const y_n = rpm[i];

        const k1 = get_dRPM(t_n, y_n, time_limit, valve_end_time, K);
        const k2 = get_dRPM(t_n + dt / 2, y_n + dt * k1 / 2, time_limit, valve_end_time, K);
        const k3 = get_dRPM(t_n + dt / 2, y_n + dt * k2 / 2, time_limit, valve_end_time, K);
        const k4 = get_dRPM(t_n + dt, y_n + dt * k3, time_limit, valve_end_time, K);

        const y_next = y_n + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
        const t_next = t_n + dt;

        time[i + 1] = t_next;
        rpm[i + 1] = y_next;
        fr_vals[i + 1] = getFR(t_next, time_limit, valve_end_time, K);
        s_vals[i + 1] = getS(fr_vals[i + 1]);
        drpm[i + 1] = get_dRPM(t_next, y_next, time_limit, valve_end_time, K);
        frv_state[i + 1] = getFRVState(t_next, time_limit, valve_end_time);

        if (y_next > max_rpm) {
            max_rpm = y_next;
        }
    }

    return { 
        time: Array.from(time),
        rpm: Array.from(rpm),
        s_vals: Array.from(s_vals),
        fr_vals: Array.from(fr_vals),
        drpm: Array.from(drpm),
        frv_state,
        max_rpm
    };
}

export function optimizeTimeLimit(temp: number, target_rpm: number): { timeLimit: number, valveEndTime: number } {
    const K = Math.sqrt(C1 * (temp - 323)) / 10;
    const Target_FR = (target_rpm + 250) / 900;
    const getValveEndTime = (t_lim: number) => 2 * t_lim + 0.15 - 100 * Target_FR / K;

    let low = 100 * Target_FR / K + 0.01; 
    let high = 150;
    let mid = (low + high) / 2;
    const tolerance = 1e-4;

    for (let i = 0; i < 60; i++) {
        mid = (low + high) / 2;
        const v_end = getValveEndTime(mid);
        
        const steps = 300;
        const dt = v_end / steps;
        let current_rpm = 0;
        
        for (let j = 0; j < steps; j++) {
            const t_n = j * dt;
            const k1 = get_dRPM(t_n, current_rpm, mid, v_end, K);
            const k2 = get_dRPM(t_n + dt/2, current_rpm + dt*k1/2, mid, v_end, K);
            const k3 = get_dRPM(t_n + dt/2, current_rpm + dt*k2/2, mid, v_end, K);
            const k4 = get_dRPM(t_n + dt, current_rpm + dt*k3, mid, v_end, K);
            current_rpm += (dt / 6) * (k1 + 2*k2 + 2*k3 + k4);
        }

        const diff = current_rpm - target_rpm;
        if (Math.abs(diff) < tolerance) break;
        
        if (diff > 0) high = mid; // Overshoot, pulse too long
        else low = mid;           // Undershoot, pulse too short
    }
    
    return { timeLimit: mid, valveEndTime: getValveEndTime(mid) };
}