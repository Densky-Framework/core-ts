import { RouteImport, RouteImportType } from "./RouteImport.ts";
import { bdd, expect } from "../../test_deps.ts";

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
      expect(routeImport.path).toEqual("/my/path");
      expect(routeImport.defaultImports).toBeSet(0);
      expect(routeImport.starImports).toBeSet(0);
      expect(routeImport.multiImports).toBeSet(0);
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

      expect(get()).toBeSet(4);
      get().forEach((im, i) => expect(im).toEqual((+i).toString()));
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

      expect(get()).toBeSet(4);
      get().forEach((im, i) => expect(im).toEqual((+i).toString()));
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

      expect(get()).toBeSet(5);
      get().forEach((im, i) => expect(im).toEqual((+i).toString()));
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

      expect(routeImport.toImportString()).toEqual(`import d1 from "/my/path";
import d2 from "/my/path";
import d4 from "/my/path"`);
    });

    bdd.it("- Only stars", () => {
      addStar("s1");
      addStar("s2");
      addStar("s4");

      expect(routeImport.toImportString()).toEqual(
        `import * as s1 from "/my/path";
import * as s2 from "/my/path";
import * as s4 from "/my/path"`,
      );
    });

    bdd.it("- Only multi imports", () => {
      addMulti(["m1"]);
      addMulti(["m2", "m3"]);

      expect(routeImport.toImportString()).toEqual(
        'import {m1,m2,m3} from "/my/path"',
      );
    });

    bdd.it("- All", () => {
      addDefault("d1");
      addDefault("d2");

      addStar("s1");
      addStar("s2");

      addMulti(["m1", "m2"]);

      expect(routeImport.toImportString()).toEqual(
        `import * as s1 from "/my/path";
import * as s2 from "/my/path";
import d1, {m1,m2} from "/my/path";
import d2 from "/my/path"`,
      );
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
    expect(allIdents).toBeInstanceOf(Map);

    expect(allIdents.get("d1")).toEqual(RouteImportType.Default);
    expect(allIdents.get("s1")).toEqual(RouteImportType.Star);
    expect(allIdents.get("m1")).toEqual(RouteImportType.Multi);
    expect(allIdents.get("m2")).toEqual(RouteImportType.Multi);

    expect(allIdents.size).toEqual(5);
  });

  /**********************************\
  |****** RouteImport.getDefOf ******|
  \**********************************/

  bdd.describe(".getDefOf", () => {
    bdd.it("- Only default", () => {
      const out = RouteImport.getDefOf("d1");

      expect(out).toEqual({
        multiImports: null,
        starImport: null,
        defaultImport: "d1",
      });
    });

    bdd.it("- Only star", () => {
      const out = RouteImport.getDefOf("* as s1");

      expect(out).toEqual({
        multiImports: null,
        starImport: "s1",
        defaultImport: null,
      });
    });

    bdd.it("- Multi: 0", () => {
      const out = RouteImport.getDefOf("{}");

      expect(out).toEqual({
        multiImports: [],
        starImport: null,
        defaultImport: null,
      });
    });

    bdd.it("- Multi: 1", () => {
      const out = RouteImport.getDefOf("{ m1}");

      expect(out).toEqual({
        multiImports: ["m1"],
        starImport: null,
        defaultImport: null,
      });
    });

    bdd.it("- Multi: 5", () => {
      const out = RouteImport.getDefOf("{m1,m2, m4, m3, m5 }");

      expect(out).toEqual({
        multiImports: ["m1", "m2", "m4", "m3", "m5"],
        starImport: null,
        defaultImport: null,
      });
    });

    bdd.it("- Multi: 20", () => {
      const expected = Array(20)
        .fill(0)
        .map((_, i) => "m" + (i + 1));

      const out = RouteImport.getDefOf("{" + expected.join(", ") + "}");

      expect(out).toEqual({
        multiImports: expected,
        starImport: null,
        defaultImport: null,
      });
    });

    bdd.it("- Default and multi: 0", () => {
      const out = RouteImport.getDefOf("d1, {  }");

      expect(out).toEqual({
        multiImports: [],
        starImport: null,
        defaultImport: "d1",
      });
    });

    bdd.it("- Default and multi: 1", () => {
      const out = RouteImport.getDefOf("d1, {m1 }");

      expect(out).toEqual({
        multiImports: ["m1"],
        starImport: null,
        defaultImport: "d1",
      });
    });

    bdd.it("- Default and multi: 5", () => {
      const out = RouteImport.getDefOf("d1, {m1,m2,m3 , m4, m5  }");

      expect(out).toEqual({
        multiImports: ["m1", "m2", "m3", "m4", "m5"],
        starImport: null,
        defaultImport: "d1",
      });
    });

    bdd.it("- Default and multi: 20", () => {
      const expected = Array(20)
        .fill(0)
        .map((_, i) => "m" + (i + 1));
      const out = RouteImport.getDefOf("d1, {" + expected.join(", ") + "}");

      expect(out).toEqual({
        multiImports: expected,
        starImport: null,
        defaultImport: "d1",
      });
    });
  });
});
