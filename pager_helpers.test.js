/***********************************************************************
 *          pager_helpers.test.mjs
 *
 *      Unit tests for the pure navigation-stack logic of C_YUI_PAGER.
 *      Run with: node --test tests/
 ***********************************************************************/
import { test, expect } from "vitest";
import {
    pager_push,
    pager_pop,
    pager_replace,
    pager_top,
    pager_header_model,
    pager_back_action,
} from "./pager_helpers.js";


/*============================================================
 *      pager_push / pager_pop / pager_replace are pure
 *============================================================*/
test("push does not mutate the input stack", () => {
    const s0 = [];
    const s1 = pager_push(s0, { id: "a", title: "A" });
    expect(s0.length).toBe(0);
    expect(s1.length).toBe(1);
    expect(s1[0].id).toBe("a");
});

test("pop returns popped entry and a shorter new stack", () => {
    const s = pager_push(pager_push([], { id: "a" }), { id: "b" });
    const r = pager_pop(s);
    expect(r.popped.id).toBe("b");
    expect(r.stack.length).toBe(1);
    expect(s.length).toBe(2); // original untouched
});

test("pop on empty stack returns null", () => {
    expect(pager_pop([])).toBe(null);
});

test("replace swaps the top, keeps depth, reports replaced", () => {
    const s = pager_push(pager_push([], { id: "a" }), { id: "b" });
    const r = pager_replace(s, { id: "b2" });
    expect(r.stack.length).toBe(2);
    expect(r.stack[1].id).toBe("b2");
    expect(r.replaced.id).toBe("b");
});

test("replace on empty stack just pushes", () => {
    const r = pager_replace([], { id: "x" });
    expect(r.stack.length).toBe(1);
    expect(r.replaced).toBe(null);
});

test("pager_top returns the last entry or null", () => {
    expect(pager_top([])).toBe(null);
    expect(pager_top([{ id: "a" }, { id: "b" }]).id).toBe("b");
});


/*============================================================
 *      pager_header_model
 *============================================================*/
test("root page: title falls back to root_title", () => {
    const m = pager_header_model([{ id: "root", title: "" }], {
        root_title: "Preferences",
        back_on_root: true,
    });
    expect(m.title).toBe("Preferences");
    expect(m.depth).toBe(1);
});

test("root page: show_back follows back_on_root", () => {
    expect(pager_header_model([{ id: "r" }], { back_on_root: true }).show_back).toBe(true);
    expect(pager_header_model([{ id: "r" }], { back_on_root: false }).show_back).toBe(false);
});

test("deep page: back always shown, title from top entry", () => {
    const m = pager_header_model(
        [{ id: "r", title: "Root" }, { id: "lang", title: "Language" }],
        { root_title: "Root", back_on_root: false }
    );
    expect(m.show_back).toBe(true);
    expect(m.title).toBe("Language");
    expect(m.depth).toBe(2);
});

test("discard shown only when with_discard AND top.discardable", () => {
    const top_yes = [{ id: "p", discardable: true }];
    const top_no  = [{ id: "p", discardable: false }];
    expect(pager_header_model(top_yes, { with_discard: true }).show_discard).toBe(true);
    expect(pager_header_model(top_yes, { with_discard: false }).show_discard).toBe(false);
    expect(pager_header_model(top_no, { with_discard: true }).show_discard).toBe(false);
});

test("empty stack: title is root_title, depth 0", () => {
    const m = pager_header_model([], { root_title: "X" });
    expect(m.title).toBe("X");
    expect(m.depth).toBe(0);
});

test("back_kind: root+back_on_root -> 'close'", () => {
    const m = pager_header_model([{ id: "r" }], { back_on_root: true });
    expect(m.back_kind).toBe("close");
    expect(m.show_back).toBe(true);
});

test("back_kind: root without back_on_root -> 'none'", () => {
    const m = pager_header_model([{ id: "r" }], { back_on_root: false });
    expect(m.back_kind).toBe("none");
    expect(m.show_back).toBe(false);
});

test("back_kind: deeper page -> 'back'", () => {
    const m = pager_header_model(
        [{ id: "r" }, { id: "lang" }], { back_on_root: true }
    );
    expect(m.back_kind).toBe("back");
    expect(m.show_back).toBe(true);
});


/*============================================================
 *      pager_back_action
 *============================================================*/
test("back with depth>1 -> pop", () => {
    expect(pager_back_action([{ id: "a" }, { id: "b" }], false)).toEqual({ type: "pop" });
});

test("back at root with back_on_root -> exit", () => {
    expect(pager_back_action([{ id: "a" }], true)).toEqual({ type: "exit" });
});

test("back at root without back_on_root -> noop", () => {
    expect(pager_back_action([{ id: "a" }], false)).toEqual({ type: "noop" });
});

test("back on empty stack without back_on_root -> noop", () => {
    expect(pager_back_action([], false)).toEqual({ type: "noop" });
});
