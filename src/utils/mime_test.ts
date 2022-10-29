import { bdd } from "../test_deps.ts";
import { getType } from "./mime.ts";
const expect = chai.expect;

function testType(input: string, expected: string) {
  const output = getType(input);
  expect(output, input).to.be.a("string");
  expect(output, input).to.be.equal(expected);
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
