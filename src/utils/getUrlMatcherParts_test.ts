import { getUrlMatcherParts } from "./urlToMatcher.ts";
import { bdd } from "../test_deps.ts";
const expect = chai.expect;

bdd.describe("getUrlMatcherParts", () => {
  bdd.it("Simple", () => {
    const parts = getUrlMatcherParts("/my/path");

    expect(parts).to.be.an("Array").with.lengthOf(2);
    expect(parts[0]).to.be.an("object").deep.equal({
      raw: "my",
      isVar: false,
    });
    expect(parts[1]).to.be.an("object").deep.equal({
      raw: "path",
      isVar: false,
    });
  });

  bdd.it("With slash at end", () => {
    const parts = getUrlMatcherParts("/my/path/");

    expect(parts).to.be.an("Array").with.lengthOf(2);
    expect(parts[0]).to.be.an("object").deep.equal({
      raw: "my",
      isVar: false,
    });
    expect(parts[1]).to.be.an("object").deep.equal({
      raw: "path",
      isVar: false,
    });
  });

  bdd.it("With one var", () => {
    const parts = getUrlMatcherParts("/my/[myVar]/");

    expect(parts).to.be.an("Array").with.lengthOf(2);
    expect(parts[0]).to.be.an("object").deep.equal({
      raw: "my",
      isVar: false,
    });
    expect(parts[1]).to.be.an("object");
    expect(parts[1]).to.have.property("raw", "[myVar]");
    expect(parts[1]).to.have.property("isVar", true, "Isn't var");
    expect(parts[1]).to.have.property("varname", "myVar", "Wrong varname");
  });

  bdd.it("With multiple vars", () => {
    const parts = getUrlMatcherParts(
      "/[atBeginning]/p1/[v1]/p2/[v2]/[v3]/[str][ange]/last/",
    );

    expect(parts).to.be.an("Array").with.lengthOf(8);
    expect(parts[0]).to.be.an("object").deep.equal({
      raw: "[atBeginning]",
      isVar: true,
      varname: "atBeginning",
    });
    expect(parts[1]).to.be.an("object").deep.equal({
      raw: "p1",
      isVar: false,
    });
    expect(parts[2]).to.be.an("object").deep.equal({
      raw: "[v1]",
      isVar: true,
      varname: "v1",
    });
    expect(parts[3]).to.be.an("object").deep.equal({
      raw: "p2",
      isVar: false,
    });
    expect(parts[4]).to.be.an("object").deep.equal({
      raw: "[v2]",
      isVar: true,
      varname: "v2",
    });
    expect(parts[5]).to.be.an("object").deep.equal({
      raw: "[v3]",
      isVar: true,
      varname: "v3",
    });
    expect(parts[6]).to.be.an("object").deep.equal({
      raw: "[str][ange]",
      isVar: true,
      varname: "str][ange",
    });
    expect(parts[7]).to.be.an("object").deep.equal({
      raw: "last",
      isVar: false,
    });
  });
});
