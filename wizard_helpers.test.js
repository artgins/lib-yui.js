/***********************************************************************
 *          wizard_helpers.test.mjs
 *
 *      Unit tests for the pure step logic of C_YUI_WIZARD.
 *      Run with: node --test tests/
 ***********************************************************************/
import { test, expect } from "vitest";
import {
    wizard_clamp_index,
    wizard_next_index,
    wizard_prev_index,
    wizard_step_model,
    wizard_accumulate,
    wizard_should_validate,
} from "./wizard_helpers.js";


/*============================================================
 *      clamp / next / prev
 *============================================================*/
test("clamp: negative -> 0, overflow -> count-1, empty -> 0", () => {
    expect(wizard_clamp_index(-3, 4)).toBe(0);
    expect(wizard_clamp_index(9, 4)).toBe(3);
    expect(wizard_clamp_index(2, 4)).toBe(2);
    expect(wizard_clamp_index(0, 0)).toBe(0);
});

test("next/prev never wrap", () => {
    expect(wizard_next_index(0, 3)).toBe(1);
    expect(wizard_next_index(2, 3)).toBe(2);   // already last
    expect(wizard_prev_index(0, 3)).toBe(0);   // already first
    expect(wizard_prev_index(2, 3)).toBe(1);
});


/*============================================================
 *      wizard_step_model
 *============================================================*/
const STEPS = [
    { id: "a", title: "Step A" },
    { id: "b", title: "Step B" },
    { id: "c", title: "Step C" },
];

test("first step: is_first, back hidden, primary='next'", () => {
    const m = wizard_step_model(STEPS, 0, {
        allow_back: true, confirm_label: "confirm", next_label: "next",
    });
    expect(m.idx).toBe(0);
    expect(m.count).toBe(3);
    expect(m.id).toBe("a");
    expect(m.is_first).toBe(true);
    expect(m.is_last).toBe(false);
    expect(m.show_back).toBe(false);          // first step, even if allow_back
    expect(m.primary_label).toBe("next");
});

test("middle step: back shown when allow_back", () => {
    expect(wizard_step_model(STEPS, 1, { allow_back: true }).show_back).toBe(true);
    expect(wizard_step_model(STEPS, 1, { allow_back: false }).show_back).toBe(false);
});

test("last step: is_last, primary='confirm'", () => {
    const m = wizard_step_model(STEPS, 2, {
        allow_back: true, confirm_label: "confirm", next_label: "next",
    });
    expect(m.is_last).toBe(true);
    expect(m.primary_label).toBe("confirm");
    expect(m.title).toBe("Step C");
});

test("out-of-range idx is clamped by the model", () => {
    const m = wizard_step_model(STEPS, 99, {});
    expect(m.idx).toBe(2);
    expect(m.is_last).toBe(true);
});

test("default labels when opts omitted", () => {
    const m = wizard_step_model(STEPS, 0, {});
    expect(m.primary_label).toBe("next");
    const last = wizard_step_model(STEPS, 2, {});
    expect(last.primary_label).toBe("confirm");
});


/*============================================================
 *      wizard_accumulate (pure, immutable)
 *============================================================*/
test("accumulate merges flat and keeps per-step, no mutation", () => {
    const a1 = wizard_accumulate(null, "a", { x: 1 });
    const a2 = wizard_accumulate(a1, "b", { y: 2 });
    expect(a2.merged).toEqual({ x: 1, y: 2 });
    expect(a2.by_step).toEqual({ a: { x: 1 }, b: { y: 2 } });
    // a1 untouched
    expect(a1.merged).toEqual({ x: 1 });
    expect(a1.by_step).toEqual({ a: { x: 1 } });
});

test("accumulate: later step overrides merged key but keeps by_step", () => {
    const a1 = wizard_accumulate(null, "a", { v: "first" });
    const a2 = wizard_accumulate(a1, "b", { v: "second" });
    expect(a2.merged.v).toBe("second");
    expect(a2.by_step.a.v).toBe("first");
    expect(a2.by_step.b.v).toBe("second");
});

test("accumulate tolerates missing kw", () => {
    const a = wizard_accumulate(null, "a");
    expect(a.merged).toEqual({});
    expect(a.by_step).toEqual({ a: {} });
});


/*============================================================
 *      wizard_should_validate
 *============================================================*/
test("validate only when linear AND step has a gobj", () => {
    expect(wizard_should_validate(true, true)).toBe(true);
    expect(wizard_should_validate(true, false)).toBe(false);
    expect(wizard_should_validate(false, true)).toBe(false);
    expect(wizard_should_validate(false, false)).toBe(false);
});
