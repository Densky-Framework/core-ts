import { bdd, expect } from "../../test_deps.ts";
import { errors, handleParser, makeError } from "./handleParser.ts";

bdd.describe("Compiler/Ws - handleParser", () => {
  const path = Deno.cwd() + "/path/TestFile";
  const relPath = "path/TestFile";

  bdd.it("Test 1", () => {
    const handler = handleParser(
      `
import {} from "import/path"
import {WsRequest, WsContext} from "densky"

export default function handleWS(ctxParam: WsContext, reqParam: WsRequest): void {
  // More lines :D
  console.log(ctx, req);

  if (!req.isConnected) return console.log(req.id, "ISN'T CONNECTED");

  req.send(req.path, "Echo: " + req.data);
}
`,
      path,
    );

    expect(handler.body).toEqual(`
  // More lines :D
  console.log(ctx, req);

  if (!req.isConnected) return console.log(req.id, "ISN'T CONNECTED");

  req.send(req.path, "Echo: " + req.data);
`);
    expect(handler.ctxParam).toEqual("ctxParam");
    expect(handler.sockParam).toEqual("reqParam");
  });

  bdd.it("Test 2", () => {
    const handler = handleParser(
      `
import {} from "import/path"
import {WsRequest, WsContext} from "densky"

export default function handleWS(ctxParam: WsContext): void {
}
`,
      path,
    );

    expect(handler.body).toEqual(`
`);
    expect(handler.ctxParam).toEqual("ctxParam");
    expect(handler.sockParam).toBeUndefined();
  });

  bdd.it("Test 3", () => {
    const handler = handleParser(
      `
import {} from "import/path"
import {WsRequest, WsContext} from "densky"

export default function handleWS(): void {
}
`,
      path,
    );

    expect(handler.body).toEqual(`
`);
    expect(handler.ctxParam).toBeUndefined();
    expect(handler.sockParam).toBeUndefined();
  });

  bdd.it("Test Fails", () => {
    const tests = [
      [`export const a = 5;`, makeError(relPath, errors.NO_DEFAULT)],
      [`export default class :D`, makeError(relPath, errors.INVALID_EXPORT)],
      [
        `export default function withoutBrace()`,
        makeError(relPath, errors.INVALID_EXPORT),
      ],
    ];

    for (const [idx, [test, expectError]] of tests.entries()) {
      expect(
        () => handleParser(test as string, path),
        // `[Index ${idx}]`,
      ).toThrow((expectError as Error).message);
    }
  });
});
