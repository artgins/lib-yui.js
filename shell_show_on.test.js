/***********************************************************************
 *          shell_show_on.test.mjs
 *
 *      Unit tests for the pure `show_on` expression parser used by
 *      C_YUI_SHELL.  Run with:
 *          node --test tests/
 ***********************************************************************/
import { test, expect } from "vitest";
import {
    BULMA_BP_ORDER,
    breakpoints_from_expr,
    bulma_hidden_class,
} from "./shell_show_on.js";


/*  Helpers */
const VISIBLE   = { mobile:true,  tablet:true,  desktop:true,  widescreen:true,  fullhd:true  };
const INVISIBLE = { mobile:false, tablet:false, desktop:false, widescreen:false, fullhd:false };


test("empty expression ⇒ visible at every breakpoint", () => {
    expect(breakpoints_from_expr("")).toEqual(VISIBLE);
    expect(breakpoints_from_expr("  ")).toEqual(VISIBLE);
    expect(breakpoints_from_expr("*")).toEqual(VISIBLE);
    expect(breakpoints_from_expr(null)).toEqual(VISIBLE);
    expect(breakpoints_from_expr(undefined)).toEqual(VISIBLE);
});

test("single breakpoint ⇒ only that one", () => {
    expect(breakpoints_from_expr("mobile")).toEqual({ ...INVISIBLE, mobile: true });
    expect(breakpoints_from_expr("desktop")).toEqual({ ...INVISIBLE, desktop: true });
    expect(breakpoints_from_expr("fullhd")).toEqual({ ...INVISIBLE, fullhd: true });
});

test("OR combination with '|'", () => {
    expect(breakpoints_from_expr("mobile|tablet")).toEqual({ ...INVISIBLE, mobile: true, tablet: true });
    expect(breakpoints_from_expr("tablet | desktop | widescreen")).toEqual({ ...INVISIBLE, tablet: true, desktop: true, widescreen: true });
});

test(">=desktop means desktop and everything wider", () => {
    expect(breakpoints_from_expr(">=desktop")).toEqual({ ...INVISIBLE, desktop: true, widescreen: true, fullhd: true });
});

test(">mobile is strictly wider than mobile", () => {
    expect(breakpoints_from_expr(">mobile")).toEqual({ ...INVISIBLE, tablet: true, desktop: true, widescreen: true, fullhd: true });
});

test("<desktop is strictly narrower than desktop", () => {
    expect(breakpoints_from_expr("<desktop")).toEqual({ ...INVISIBLE, mobile: true, tablet: true });
});

test("<=tablet includes tablet and everything narrower", () => {
    expect(breakpoints_from_expr("<=tablet")).toEqual({ ...INVISIBLE, mobile: true, tablet: true });
});

test("< against the smallest breakpoint yields nothing", () => {
    /*  Historical guard: '<mobile' should be empty, not the whole set. */
    expect(breakpoints_from_expr("<mobile")).toEqual(INVISIBLE);
});

test("> against the widest breakpoint yields nothing", () => {
    expect(breakpoints_from_expr(">fullhd")).toEqual(INVISIBLE);
});

test("unknown tokens are ignored (no throw)", () => {
    expect(breakpoints_from_expr("phablet")).toEqual(INVISIBLE);
    /*  Valid ones in the mix still apply. */
    expect(breakpoints_from_expr("phablet|mobile")).toEqual({ ...INVISIBLE, mobile: true });
});

test("OR combining ranges is the union of ranges", () => {
    expect(breakpoints_from_expr(">=desktop | mobile")).toEqual({ ...INVISIBLE, mobile: true, desktop: true, widescreen: true, fullhd: true });
});

test("BULMA_BP_ORDER is low→high and complete", () => {
    expect(BULMA_BP_ORDER).toEqual(["mobile", "tablet", "desktop", "widescreen", "fullhd"]);
});

test("bulma_hidden_class maps each breakpoint correctly", () => {
    expect(bulma_hidden_class("mobile")).toBe("yui-hidden-mobile");
    expect(bulma_hidden_class("tablet")).toBe("yui-hidden-tablet-only");
    expect(bulma_hidden_class("desktop")).toBe("yui-hidden-desktop-only");
    expect(bulma_hidden_class("widescreen")).toBe("yui-hidden-widescreen-only");
    expect(bulma_hidden_class("fullhd")).toBe("yui-hidden-fullhd");
    expect(bulma_hidden_class("nonsense")).toBe("");
});
