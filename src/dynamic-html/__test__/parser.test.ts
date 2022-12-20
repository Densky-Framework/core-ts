import { bdd } from "../../test_deps.ts";
import { block, eval_, import_, literal } from "./common.ts";
import { parseDynamicHtml } from "../parser.ts";
const expect = chai.expect;

bdd.describe("[DynamicHtml/parser]", () => {
  bdd.it("Import's", () => {
    expect(parseDynamicHtml(`{$ "./file.ts" as DEFAULT }`)).to.deep.equal(
      [import_(`"./file.ts" as DEFAULT`)],
    );

    expect(parseDynamicHtml(`{$ func1 from "./file.ts" }`)).to.deep.equal(
      [import_(`func1 from "./file.ts"`)],
    );
  });

  bdd.it("Eval's", () => {
    expect(parseDynamicHtml(`{ data }`)).to.deep.equal(
      [eval_("data")],
    );

    expect(parseDynamicHtml(`{ data.myProp }`)).to.deep.equal(
      [eval_("data.myProp")],
    );

    expect(parseDynamicHtml(`{ 1 + 2 }`)).to.deep.equal(
      [eval_("1 + 2")],
    );
  });

  bdd.it("Block's", () => {
    expect(parseDynamicHtml(`{! if (data) } a {/}`)).to.deep.equal(
      [block("if (data) {"), literal("a"), block("}")],
    );

    expect(parseDynamicHtml(`{! for (const a of b) } {b} {/}`)).to.deep.equal(
      [block("for (const a of b) {"), eval_("b"), block("}")],
    );

    expect(parseDynamicHtml(`{# const a = data.b } {a}`)).to.deep.equal(
      [block("const a = data.b"), eval_("a")],
    );
  });
});
