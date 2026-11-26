import { describe, it, expect, beforeEach } from "vitest";
import { S, createSim, step, opRot, opSlips, opKick, opBop } from "@/game/sim";

const run = (sec: number) => { for (let t = 0; t < sec; t += 0.05) step(0.05); };
beforeEach(() => Object.assign(S, createSim()));

describe("drilling rules", () => {
  it("lever up raises, down lowers, neutral stops the top drive", () => {
    S.lever = -1; run(2); const low = S.h; expect(low).toBeLessThan(28);
    S.lever = 0; run(2); expect(Math.abs(S.h - low)).toBeLessThan(1); expect(S.vel).toBeCloseTo(0, 3);
    const stop = S.h; S.lever = 1; run(2); expect(S.h).toBeGreaterThan(stop);
  });
  it("rotation needs mud circulation", () => {
    opRot(); expect(S.rotOn).toBe(0);
    S.pumpOn = 1; run(3); opRot(); expect(S.rotOn).toBe(1);
  });
  it("slips cannot be released before the pipe is connected", () => {
    S.hole = 3000; S.lever = -1; run(18); S.lever = 0; run(2);
    opSlips(); expect(S.slips).toBe(1); expect(S.needConn).toBe(1);
    opSlips(); expect(S.slips).toBe(1);
  });
  it("closing the BOP stops the influx during a kick", () => {
    opKick(); run(1); expect(S.influx).toBeGreaterThan(0);
    opBop(); run(1); expect(S.influx).toBe(0); expect(S.fout).toBe(0);
  });
});
