import { bdd, expect } from "../../test_deps.ts";
import { getMimeType } from "./mime.ts";

function testType(input: string, expected: string) {
  const output = getMimeType(input);
  expect(output).toEqual(expected);
}

function testTypes(cases: Record<string, string>) {
  for (const [input, expected] of Object.entries(cases)) {
    testType(input, expected);
  }
}

bdd.describe("mime", () => {
  bdd.it("frontend common types", () => {
    testTypes({
      js: "application/javascript",
      html: "text/html",
      css: "text/css",
      txt: "text/plain",
    });
  });
});
