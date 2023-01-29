import { bdd, expect } from "../../test_deps.ts";
import { block, eval_, import_, literal } from "./common.ts";
import { parseDynamicHtml } from "../parser.ts";

bdd.describe("[DynamicHtml/parser]", () => {
  bdd.it("Literal's", () => {
    expect(parseDynamicHtml(`ABC`)).toEqual(
      [literal("ABC")],
    );

    expect(parseDynamicHtml(`abcABC123'";:\\`)).toEqual(
      [literal(`abcABC123'";:\\`)],
    );
  });

  bdd.it("Import's", () => {
    expect(parseDynamicHtml(`{$ "./file.ts" as DEFAULT }`)).toEqual(
      [import_(`"./file.ts" as DEFAULT`)],
    );

    expect(parseDynamicHtml(`{$ func1 from "./file.ts" }`)).toEqual(
      [import_(`func1 from "./file.ts"`)],
    );
  });

  bdd.it("Eval's", () => {
    expect(parseDynamicHtml(`{ data }`)).toEqual(
      [eval_("data")],
    );

    expect(parseDynamicHtml(`{ data.myProp }`)).toEqual(
      [eval_("data.myProp")],
    );

    expect(parseDynamicHtml(`{ 1 + 2 }`)).toEqual(
      [eval_("1 + 2")],
    );
  });

  bdd.it("Block's", () => {
    expect(parseDynamicHtml(`{! if (data) } a {/}`)).toEqual(
      [block("if (data) {"), literal("a"), block("}")],
    );

    expect(parseDynamicHtml(`{! for (const a of b) } {b} {/}`)).toEqual(
      [block("for (const a of b) {"), eval_("b"), block("}")],
    );

    expect(parseDynamicHtml(`{# const a = data.b } {a}`)).toEqual(
      [block("const a = data.b"), eval_("a")],
    );
  });
});
