import { RouteImport, RouteImportType } from "./RouteImport.ts";
import "../test_deps.ts";
import { bdd } from "../test_deps.ts";
const expect = chai.expect;

function setSize(n: number) {
  return (v: Set<unknown>) => v.size === n;
}

bdd.describe("RouteImport", () => {
  let routeImport: RouteImport;
  const addDefault = (t: string) => routeImport.addDefaultImport(t);
  const addStar = (t: string) => routeImport.addStarImport(t);
  const addMulti = (t: string[]) => routeImport.addMultiImports(t);

  bdd.beforeEach(() => {
    routeImport = new RouteImport("/my/path");
  });

  bdd.describe("should be instanced", () => {
    bdd.it("- Verify default values", () => {
      expect(routeImport).to.be.an("object");
      expect(routeImport.path).to.be.a("string").that.be.equals("/my/path");
      expect(routeImport.defaultImports)
        .to.be.a("Set")
        .and.satisfies(setSize(0));
      expect(routeImport.starImports).to.be.a("Set").and.satisfies(setSize(0));
      expect(routeImport.multiImports).to.be.a("Set").and.satisfies(setSize(0));
    });
  });

  bdd.describe("> Adders", () => {
    /**********************************\
    |******* #addDefaultImport ********|
    \**********************************/

    bdd.it("#addDefaultImport", () => {
      // Helpers for code repeating :D
      type TYPE = string;
      const add = (t: TYPE) => routeImport.addDefaultImport(t);
      const get = () => routeImport.defaultImports;

      add("1");
      add("2");
      add("3");
      add("2"); // Repeated (will be ignored)
      add("4");

      expect(get()).to.satisfies(setSize(4));
      get().forEach((im, i) => expect(im).to.be.equal((+i).toString()));
    });

    /**********************************\
    |********* #addStarImport *********|
    \**********************************/

    bdd.it("#addStarImport", () => {
      // Helpers for code repeating :D
      type TYPE = string;
      const add = (t: TYPE) => routeImport.addStarImport(t);
      const get = () => routeImport.starImports;

      add("1");
      add("2");
      add("3");
      add("2"); // Repeated (will be ignored)
      add("4");

      expect(get()).to.satisfies(setSize(4));
      get().forEach((im, i) => expect(im).to.be.equal((+i).toString()));
    });

    /**********************************\
    |******** #addMultiImports ********|
    \**********************************/

    bdd.it("#addMultiImports", () => {
      // Helpers for code repeating :D
      type TYPE = string[];
      const add = (t: TYPE) => routeImport.addMultiImports(t);
      const get = () => routeImport.multiImports;

      add(["1"]);
      add(["2"]);
      add(["3"]);
      add(["2"]); // Repeated (will be ignored)
      add(["4", "5"]);

      expect(get()).to.satisfies(setSize(5));
      get().forEach((im, i) => expect(im).to.be.equal((+i).toString()));
    });
  });

  /**********************************\
  |******** #toImportString *********|
  \**********************************/

  bdd.describe("#toImportString", () => {
    bdd.it("- Only defaults", () => {
      addDefault("d1");
      addDefault("d2");
      addDefault("d4");

      expect(routeImport.toImportString()).to.be
        .equal(`import d1 from "/my/path";
import d2 from "/my/path";
import d4 from "/my/path"`);
    });

    bdd.it("- Only stars", () => {
      addStar("s1");
      addStar("s2");
      addStar("s4");

      expect(routeImport.toImportString()).to.be
        .equal(`import * as s1 from "/my/path";
import * as s2 from "/my/path";
import * as s4 from "/my/path"`);
    });

    bdd.it("- Only multi imports", () => {
      addMulti(["m1"]);
      addMulti(["m2", "m3"]);

      expect(routeImport.toImportString()).to.be.equal(
        'import {m1,m2,m3} from "/my/path"'
      );
    });

    bdd.it("- All", () => {
      addDefault("d1");
      addDefault("d2");

      addStar("s1");
      addStar("s2");

      addMulti(["m1", "m2"]);

      expect(routeImport.toImportString()).to.be
        .equal(`import * as s1 from "/my/path";
import * as s2 from "/my/path";
import d1, {m1,m2} from "/my/path";
import d2 from "/my/path"`);
    });
  });

  /**********************************\
  |******* Instance.getDefOf ********|
  \**********************************/

  bdd.it("#getAllIdents", () => {
    addDefault("d1");
    addStar("s1");
    addStar("s2");
    addMulti(["m1", "m2"]);

    const allIdents = routeImport.getAllIdents();
    expect(allIdents).to.be.a("Map");

    expect(allIdents.get("d1")).to.be.equal(RouteImportType.Default);
    expect(allIdents.get("s1")).to.be.equal(RouteImportType.Star);
    expect(allIdents.get("m1")).to.be.equal(RouteImportType.Multi);
    expect(allIdents.get("m2")).to.be.equal(RouteImportType.Multi);

    expect(allIdents.size).to.be.equal(5, "Size doesn't fit to 4");
  });

  /**********************************\
  |****** RouteImport.getDefOf ******|
  \**********************************/

  bdd.describe(".getDefOf", () => {
    bdd.it("- Only default", () => {
      const out = RouteImport.getDefOf("d1");

      expect(out).to.be.an("object");
      expect(out).to.have.own.property("multiImports", null);
      expect(out).to.have.own.property("starImport", null);
      expect(out).to.have.own.property("defaultImport", "d1");
    });

    bdd.it("- Only star", () => {
      const out = RouteImport.getDefOf("* as s1");

      expect(out).to.be.an("object");
      expect(out).to.have.own.property("multiImports", null);
      expect(out).to.have.own.property("starImport", "s1");
      expect(out).to.have.own.property("defaultImport", null);
    });

    bdd.it("- Multi: 0", () => {
      const out = RouteImport.getDefOf("{}");

      expect(out).to.be.an("object");
      expect(out).to.have.own.property("multiImports").deep.equal([]);
      expect(out).to.have.own.property("starImport", null);
      expect(out).to.have.own.property("defaultImport", null);
    });

    bdd.it("- Multi: 1", () => {
      const out = RouteImport.getDefOf("{ m1}");

      expect(out).to.be.an("object");
      expect(out).to.have.own.property("multiImports").deep.equal(["m1"]);
      expect(out).to.have.own.property("starImport", null);
      expect(out).to.have.own.property("defaultImport", null);
    });

    bdd.it("- Multi: 5", () => {
      const out = RouteImport.getDefOf("{m1,m2, m4, m3, m5 }");

      expect(out).to.be.an("object");
      expect(out)
        .to.have.own.property("multiImports")
        .deep.equal(["m1", "m2", "m4", "m3", "m5"]);
      expect(out).to.have.own.property("starImport", null);
      expect(out).to.have.own.property("defaultImport", null);
    });

    bdd.it("- Multi: 20", () => {
      const expected = Array(20)
        .fill(0)
        .map((_, i) => "m" + (i + 1));

      const out = RouteImport.getDefOf("{" + expected.join(", ") + "}");

      expect(out).to.be.an("object");
      expect(out).to.have.own.property("multiImports").deep.equal(expected);
      expect(out).to.have.own.property("starImport", null);
      expect(out).to.have.own.property("defaultImport", null);
    });

    bdd.it("- Default and multi: 0", () => {
      const out = RouteImport.getDefOf("d1, {  }");

      expect(out).to.be.an("object");
      expect(out).to.have.own.property("multiImports").deep.equal([]);
      expect(out).to.have.own.property("starImport", null);
      expect(out).to.have.own.property("defaultImport", "d1");
    });

    bdd.it("- Default and multi: 1", () => {
      const out = RouteImport.getDefOf("d1, {m1 }");

      expect(out).to.be.an("object");
      expect(out).to.have.own.property("multiImports").deep.equal(["m1"]);
      expect(out).to.have.own.property("starImport", null);
      expect(out).to.have.own.property("defaultImport", "d1");
    });

    bdd.it("- Default and multi: 5", () => {
      const out = RouteImport.getDefOf("d1, {m1,m2,m3 , m4, m5  }");

      expect(out).to.be.an("object");
      expect(out)
        .to.have.own.property("multiImports")
        .deep.equal(["m1", "m2", "m3", "m4", "m5"]);
      expect(out).to.have.own.property("starImport", null);
      expect(out).to.have.own.property("defaultImport", "d1");
    });

    bdd.it("- Default and multi: 20", () => {
      const expected = Array(20)
        .fill(0)
        .map((_, i) => "m" + (i + 1));
      const out = RouteImport.getDefOf("d1, {" + expected.join(", ") + "}");

      expect(out).to.be.an("object");
      expect(out).to.have.own.property("multiImports").deep.equal(expected);
      expect(out).to.have.own.property("starImport", null);
      expect(out).to.have.own.property("defaultImport", "d1");
    });
  });
});
