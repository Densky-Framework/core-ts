import { getUrlMatcherParts, urlToMatcher } from "./urlToMatcher.ts";
import { bdd } from "../test_deps.ts";
const expect = chai.expect;

bdd.describe("urlToMatcher", () => {
  bdd.it("Simple", () => {
    const matcher = urlToMatcher("/my/path");

    expect(matcher)
      .to.be.an("object")
      .with.keys("exact", "start", "exactDecl", "startDecl", "prepareDecl");
    expect(matcher.exact("/my/path")).to.be.true;
    expect(matcher.exact("/my/path/deep")).to.be.false;
    expect(matcher.exact("/my/pat")).to.be.false;
    expect(matcher.exact("my/path")).to.be.false;
    expect(matcher.start("/my/path/deep")).to.be.true;
    expect(matcher.start("/my/path")).to.be.true;

    expect(matcher.exactDecl("target")).to.be.equal("target === '/my/path'");
    expect(matcher.startDecl("target")).to.be.equal(
      "target.startsWith('/my/path')"
    );
    expect(matcher.prepareDecl("target", "val")).to.be.empty;
  });

  bdd.it("With one var", () => {
    const url = "/my/[myVar]";
    const matcher = urlToMatcher(url);
    const parts = getUrlMatcherParts(url);
    const partsSerialized = JSON.stringify(parts);

    expect(matcher)
      .to.be.an("object")
      .with.keys("exact", "start", "exactDecl", "startDecl", "prepareDecl");
    expect(matcher.exact("/my/path")).to.be.true;
    expect(matcher.exact("/my/pat")).to.be.true;
    expect(matcher.exact("/my/path/deep")).to.be.false;
    expect(matcher.exact("my/path")).to.be.false;
    expect(matcher.start("/my/path/deep")).to.be.true;
    expect(matcher.start("/my/path")).to.be.true;

    expect(matcher.exactDecl("target")).to.be.equal(`(() => {
          const t = urlMatcherPrepare_target;
          const p = ${partsSerialized};

          if (t.length !== p.length) return false;
          return t.every((tp,i) => {
            if (!p[i]) return false;
            if (p[i].isVar) return true;
            if (p[i].raw === tp) return true;
            return false;
          });
        }()`);
    expect(matcher.startDecl("target")).to.be.equal(`(() => {
          const t = urlMatcherPrepare_target;
          const p = ${partsSerialized};

          if (t.length < p.length) return false;
          return p.every((tp,i) => {
            if (!t[i]) return false;
            if (tp.isVar) return true;
            if (tp.raw === t[i]) return true;
            return false;
          });
        }()`);
    expect(matcher.prepareDecl("target", "val")).to.be
      .equal(`const urlMatcherPrepare_target=((target)=>{
          const t = target.split("/");
          t.shift();
          l: {
            const la = t.pop();
            if (la === undefined || la.length === 0) break l;
            t.push(last);
          }
          return t;
        })(val)`);
  });
});
