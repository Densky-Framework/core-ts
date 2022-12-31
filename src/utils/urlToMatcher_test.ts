import { urlToMatcher } from "./urlToMatcher.ts";
import { bdd, expect } from "../test_deps.ts";

bdd.describe("urlToMatcher", () => {
  bdd.it("Simple", () => {
    const matcher = urlToMatcher("/my/path");
    const params = new Map<string, string>();

    expect(matcher.exact("/my/path", params)).toBeTruthy();
    expect(matcher.exact("/my/path/deep", params)).toBeFalsy();
    expect(matcher.exact("/my/pat", params)).toBeFalsy();
    expect(matcher.exact("my/path", params)).toBeFalsy();
    expect(matcher.start("/my/path/deep")).toBeTruthy();
    expect(matcher.start("/my/path")).toBeTruthy();

    expect(matcher.exactDecl("target", "params")).toEqual(
      "urlMatcherPrepare_target === '/my/path'",
    );
    expect(matcher.startDecl("target")).toEqual(
      "urlMatcherPrepare_target.startsWith('/my/path')",
    );
    expect(matcher.prepareDecl("target", "req")).toEqual(
      "const urlMatcherPrepare_target = req.pathname;",
    );
  });

  bdd.it("With one var", () => {
    const url = "/my/[myVar]";
    const matcher = urlToMatcher(url);
    const params = new Map<string, string>();

    expect(matcher.exact("/my/path", params)).toBeTruthy();
    expect(matcher.exact("/my/pat", params)).toBeTruthy();
    expect(matcher.exact("/my/path/deep", params)).toBeFalsy();
    expect(matcher.exact("my/path", params)).toBeFalsy();
    expect(matcher.start("/my/path/deep")).toBeTruthy();
    expect(matcher.start("/my/path")).toBeTruthy();

    expect(matcher.exactDecl("target", "params")).toEqual(`(() => {
          const t = urlMatcherPrepare_target;
          const p = urlMatcherSerial_target;
          const m = params;

          if (t.length !== p.length) return false;
          m.clear();
          return t.every((tp,i) => {
            if (!p[i]) return false;
            if (p[i].isVar) {
              m.set(p[i].varname,tp);
              return true;
            }
            if (p[i].raw === tp) return true;
            return false;
          });
        })()`);
    expect(matcher.startDecl("target")).toEqual(`(() => {
          const t = urlMatcherPrepare_target;
          const p = urlMatcherSerial_target;

          if (t.length < p.length) return false;
          return p.every((tp,i) => {
            if (!t[i]) return false;
            if (tp.isVar) return true;
            if (tp.raw === t[i]) return true;
            return false;
          });
        })()`);
    expect(matcher.prepareDecl("target", "req")).toEqual(
      `const urlMatcherPrepare_target=req.byParts;`,
    );
  });
});
