import { bdd } from "../../test_deps.ts";
import { block, eval_, import_, literal } from "./common.ts";
import { generateDynamicHtml, normalizeDynamicHtml } from "../generator.ts";
import { parseDynamicHtml } from "../parser.ts";
import { pathMod } from "../../deps.ts";
const expect = chai.expect;

bdd.describe("[DynamicHtml/normalizer]", () => {
  bdd.it("Simple", () => {
    expect(
      normalizeDynamicHtml([
        literal("ABC"),
        eval_("D"),
        import_(`a as b from "./file.ts" as DEFAULT`),
      ]),
    ).to.deep.equal({
      imports: [{
        type: "import",
        content: `a as b from "./file.ts" as DEFAULT`,
        filename: "./file.ts",
        imports: "a as b",
        defaultName: "DEFAULT",
      }],
      parts: [literal("ABC"), eval_("D")],
    });

    expect(
      normalizeDynamicHtml([
        literal("ABC"),
        eval_("D"),
        import_(`"./file.ts" as DEFAULT`),
      ]),
    ).to.deep.equal({
      imports: [{
        type: "import",
        content: `"./file.ts" as DEFAULT`,
        filename: "./file.ts",
        imports: null,
        defaultName: "DEFAULT",
      }],
      parts: [literal("ABC"), eval_("D")],
    });

    expect(
      normalizeDynamicHtml([
        literal("ABC"),
        eval_("D"),
        import_(`a as b from "./file.ts"`),
      ]),
    ).to.deep.equal({
      imports: [{
        type: "import",
        content: `a as b from "./file.ts"`,
        filename: "./file.ts",
        imports: "a as b",
        defaultName: null,
      }],
      parts: [literal("ABC"), eval_("D")],
    });
  });
});

bdd.describe("[DynamicHtml/generator]", () => {
  bdd.it("", () => {
    console.log(
      generateDynamicHtml(
        normalizeDynamicHtml(parseDynamicHtml(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>{ data.title }</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="css/style.css" rel="stylesheet">
  </head>
  <body>
    <p>
      The following text is getted from path params: {data.param}
    </p>
    { data.num + 1 }
    <p> { data.condition } </p>
    {! if (data.condition) }
      <p> It's TRUE </p>
    {/ else }
      <p> It's FALSE </p>
    {/}
  </body>
</html>                                              `)),
        new URL(import.meta.resolve("../test.html")).pathname,
        new URL(import.meta.resolve("./test.ts")).pathname,
      ),
    );
    // console.log(
    //   generateDynamicHtml(
    //     normalizeDynamicHtml([
    //       literal("ABC"),
    //       eval_("data.a"),
    //       block("for (const a of data.b) {"),
    //       literal(">> "),
    //       eval_("a"),
    //       block("}"),
    //       import_(`a as b from "./file.ts" as DEFAULT`),
    //       import_(`a as b from "./file.ts"`),
    //       import_(`from "./file.ts" as DEFAULT`),
    //       import_(`"./file.ts"`),
    //     ]),
    //     new URL(import.meta.resolve("../test.html")).pathname,
    //     new URL(import.meta.resolve("./test.ts")).pathname,
    //   ),
    // );
  });
});
