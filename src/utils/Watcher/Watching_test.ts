import { bdd } from "../../test_deps.ts";
import { Watching } from "./Watching.ts";
const expect = chai.expect;

function createMockWatcher() {
  let closed = false;
  let sharedCallback: (event: Deno.FsEvent) => void;

  return {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<Deno.FsEvent>> {
          return new Promise((res) => {
            sharedCallback = (event) => {
              if (closed) return res({ done: true, value: null });
              res({ done: false, value: event });
            };
          });
        },
        [Symbol.asyncIterator]: this[Symbol.asyncIterator],
      } as AsyncIterableIterator<Deno.FsEvent>;
    },

    close() {
      closed = true;
      this.execute({ paths: [], kind: "any" });
    },

    rid: 0,

    execute(event: Deno.FsEvent) {
      if (sharedCallback) sharedCallback(event);
    },
  };
}

bdd.describe("Watcher => Watching", () => {
  bdd.it("Handled paths correctly", async () => {
    const watcher = createMockWatcher();

    let calledTimes = 0;
    const instance = new Watching(watcher, "/tmp/path");

    async function test(
      input: string[],
      expected: string[],
      shouldExecute: boolean,
    ) {
      instance((ev) => {
        calledTimes++;
        expect(ev.paths).to.deep.eq(expected);
      });

      watcher.execute({ paths: input, kind: "any" });
      // Wait for next tick, the callback must be called
      await new Promise((res) => setTimeout(res, 1));

      expect(calledTimes).to.eq(shouldExecute ? 1 : 0);
      instance.clear();
      calledTimes = 0;
    }

    await test([], [], false);
    await test(["/out/"], [], false);
    await test(["/tmp/out"], [], false);
    await test(["/tmp/path"], ["/tmp/path"], true);
    await test(["/tmp/path/"], ["/tmp/path/"], true);
    await test(["/out/path", "/tmp/path/"], ["/tmp/path/"], true);
    await test(["/tmp/path/file1"], ["/tmp/path/file1"], true);
    await test(["/tmp/path/deep/file1.ts"], ["/tmp/path/deep/file1.ts"], true);

    await new Promise((res) => setTimeout(res, 300));
    watcher.close();
  });
});
