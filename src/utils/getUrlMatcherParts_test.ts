import { getUrlMatcherParts } from "./urlToMatcher.ts";
import { bdd, expect } from "../test_deps.ts";

bdd.describe("getUrlMatcherParts", () => {
  bdd.it("Simple", () => {
    const parts = getUrlMatcherParts("/my/path");

    expect(parts).toHaveLength(2);
    expect(parts[0]).toEqual({
      raw: "my",
      isVar: false,
    });
    expect(parts[1]).toEqual({
      raw: "path",
      isVar: false,
    });
  });

  bdd.it("With slash at end", () => {
    const parts = getUrlMatcherParts("/my/path/");

    expect(parts).toHaveLength(2);
    expect(parts[0]).toEqual({
      raw: "my",
      isVar: false,
    });
    expect(parts[1]).toEqual({
      raw: "path",
      isVar: false,
    });
  });

  bdd.it("With one var", () => {
    const parts = getUrlMatcherParts("/my/[myVar]/");

    expect(parts).toHaveLength(2);
    expect(parts[0]).toEqual({
      raw: "my",
      isVar: false,
    });
    expect(parts[1]).toEqual({
      raw: "[myVar]",
      isVar: true,
      varname: "myVar",
    });
  });

  bdd.it("With multiple vars", () => {
    const parts = getUrlMatcherParts(
      "/[atBeginning]/p1/[v1]/p2/[v2]/[v3]/[str][ange]/last/",
    );

    expect(parts).toHaveLength(8);
    expect(parts[0]).toEqual({
      raw: "[atBeginning]",
      isVar: true,
      varname: "atBeginning",
    });
    expect(parts[1]).toEqual({
      raw: "p1",
      isVar: false,
    });
    expect(parts[2]).toEqual({
      raw: "[v1]",
      isVar: true,
      varname: "v1",
    });
    expect(parts[3]).toEqual({
      raw: "p2",
      isVar: false,
    });
    expect(parts[4]).toEqual({
      raw: "[v2]",
      isVar: true,
      varname: "v2",
    });
    expect(parts[5]).toEqual({
      raw: "[v3]",
      isVar: true,
      varname: "v3",
    });
    expect(parts[6]).toEqual({
      raw: "[str][ange]",
      isVar: true,
      varname: "str][ange",
    });
    expect(parts[7]).toEqual({
      raw: "last",
      isVar: false,
    });
  });
});
