import { describe, expect, it } from "vitest";
import {
  activate,
  activateDeriv,
  applyActivation,
  denseZ,
  initWeightMatrix,
  makeRng,
} from "../math";

describe("activation functions", () => {
  it("linear is identity", () => {
    expect(activate(0, "linear")).toBe(0);
    expect(activate(3.7, "linear")).toBe(3.7);
    expect(activate(-2, "linear")).toBe(-2);
  });

  it("relu clamps negatives to 0", () => {
    expect(activate(-5, "relu")).toBe(0);
    expect(activate(0, "relu")).toBe(0);
    expect(activate(2.3, "relu")).toBe(2.3);
  });

  it("sigmoid is monotonic and centered at 0.5", () => {
    expect(activate(0, "sigmoid")).toBeCloseTo(0.5);
    expect(activate(10, "sigmoid")).toBeGreaterThan(0.999);
    expect(activate(-10, "sigmoid")).toBeLessThan(0.001);
    // monotonicity
    expect(activate(1, "sigmoid")).toBeGreaterThan(activate(0, "sigmoid"));
    expect(activate(-1, "sigmoid")).toBeLessThan(activate(0, "sigmoid"));
  });

  it("tanh maps into (-1, 1) and is 0 at 0", () => {
    expect(activate(0, "tanh")).toBe(0);
    expect(activate(10, "tanh")).toBeGreaterThan(0.999);
    expect(activate(-10, "tanh")).toBeLessThan(-0.999);
  });
});

describe("activation derivatives", () => {
  it("linear derivative is 1 everywhere", () => {
    expect(activateDeriv(0, "linear")).toBe(1);
    expect(activateDeriv(7, "linear")).toBe(1);
    expect(activateDeriv(-2, "linear")).toBe(1);
  });

  it("relu derivative is a step", () => {
    expect(activateDeriv(-0.1, "relu")).toBe(0);
    expect(activateDeriv(0, "relu")).toBe(0);
    expect(activateDeriv(5, "relu")).toBe(1);
  });

  it("sigmoid derivative peaks at z=0 with value 0.25", () => {
    expect(activateDeriv(0, "sigmoid")).toBeCloseTo(0.25);
    expect(activateDeriv(100, "sigmoid")).toBeCloseTo(0, 6);
    expect(activateDeriv(-100, "sigmoid")).toBeCloseTo(0, 6);
  });

  it("tanh derivative peaks at z=0 with value 1", () => {
    expect(activateDeriv(0, "tanh")).toBeCloseTo(1);
    expect(activateDeriv(100, "tanh")).toBeCloseTo(0, 6);
  });

  it("derivatives agree with numeric finite differences (sanity)", () => {
    const kinds = ["linear", "relu", "sigmoid", "tanh"] as const;
    const eps = 1e-5;
    for (const k of kinds) {
      for (const z of [0.3, -0.4, 1.2, -2.1]) {
        const numeric = (activate(z + eps, k) - activate(z - eps, k)) / (2 * eps);
        const analytic = activateDeriv(z, k);
        expect(analytic).toBeCloseTo(numeric, 3);
      }
    }
  });
});

describe("denseZ", () => {
  it("computes W·x + b correctly", () => {
    const W = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    const b = [10, 20];
    const x = [1, 1, 1];
    expect(denseZ(W, b, x)).toEqual([16, 35]);
  });

  it("handles a single-input single-output neuron", () => {
    expect(denseZ([[0.5]], [0.1], [4])).toEqual([2.1]);
  });
});

describe("applyActivation", () => {
  it("applies elementwise", () => {
    expect(applyActivation([-1, 0, 2], "relu")).toEqual([0, 0, 2]);
    expect(applyActivation([0, 0, 0], "sigmoid")).toEqual([0.5, 0.5, 0.5]);
  });
});

describe("makeRng", () => {
  it("is deterministic for the same seed", () => {
    const a = makeRng(123);
    const b = makeRng(123);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });

  it("produces different streams for different seeds", () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(a()).not.toBe(b());
  });

  it("stays in [0, 1)", () => {
    const rng = makeRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("initWeightMatrix", () => {
  it("has the requested shape", () => {
    const W = initWeightMatrix(3, 5, makeRng(1));
    expect(W.length).toBe(3);
    for (const row of W) expect(row.length).toBe(5);
  });

  it("is deterministic given the same rng seed", () => {
    const A = initWeightMatrix(4, 3, makeRng(99));
    const B = initWeightMatrix(4, 3, makeRng(99));
    expect(A).toEqual(B);
  });
});
