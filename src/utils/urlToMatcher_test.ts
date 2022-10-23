import { urlToMatcher } from "./urlToMatcher.ts";
import { bdd } from "../test_deps.ts";
const expect = chai.expect;

bdd.describe("urlToMatcher", () => {
  bdd.it("Simple", () => {
    const matcher = urlToMatcher("/my/path");
    const params = new Map<string, string>();

    expect(matcher)
      .to.be.an("object")
      .with.keys(
        "exact",
        "start",
        "exactDecl",
        "startDecl",
        "prepareDecl",
        "serialDecl",
      );
    expect(matcher.exact("/my/path", params)).to.be.true;
    expect(matcher.exact("/my/path/deep", params)).to.be.false;
    expect(matcher.exact("/my/pat", params)).to.be.false;
    expect(matcher.exact("my/path", params)).to.be.false;
    expect(matcher.start("/my/path/deep")).to.be.true;
    expect(matcher.start("/my/path")).to.be.true;

    expect(matcher.exactDecl("target", "params")).to.be.equal(
      "urlMatcherPrepare_target === '/my/path'",
    );
    expect(matcher.startDecl("target")).to.be.equal(
      "urlMatcherPrepare_target.startsWith('/my/path')",
    );
    expect(matcher.prepareDecl("target", "req")).to.be.equal(
      "const urlMatcherPrepare_target = req.pathname;",
    );
  });

  bdd.it("With one var", () => {
    const url = "/my/[myVar]";
    const matcher = urlToMatcher(url);
    const params = new Map<string, string>();

    expect(matcher.exact("/my/path", params)).to.be.true;
    expect(matcher.exact("/my/pat", params)).to.be.true;
    expect(matcher.exact("/my/path/deep", params)).to.be.false;
    expect(matcher.exact("my/path", params)).to.be.false;
    expect(matcher.start("/my/path/deep")).to.be.true;
    expect(matcher.start("/my/path")).to.be.true;

    expect(matcher.exactDecl("target", "params")).to.be.equal(`(() => {
          const t = urlMatcherPrepare_target;
          const p = urlMatcherSerial_target;

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
    expect(matcher.startDecl("target")).to.be.equal(`(() => {
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
    expect(matcher.prepareDecl("target", "req")).to.be
      .equal(`const urlMatcherPrepare_target=req.byParts;`);
  });
});
