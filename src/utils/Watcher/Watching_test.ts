import { bdd, expect, mock } from "../../test_deps.ts";
import { WatchEvent } from "./WatchEvent.ts";
import { Watching } from "./Watching.ts";

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
      this.execute({ paths: [], kind: "create" });
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

    const instance = new Watching(watcher, "/tmp/path");

    async function test(
      input: string[],
      expected: string[],
      shouldExecute: boolean,
    ) {
      const testFunction = mock.fn((ev: WatchEvent) => {
        expect(ev.path).toEqual(expected[0]);
      });
      instance(testFunction);

      watcher.execute({ paths: input, kind: "create" });
      // Wait for next tick, the callback must be called
      await new Promise((res) => setTimeout(res, 1));

      expect(testFunction).toHaveBeenCalledTimes(shouldExecute ? 1 : 0);
      instance.clear();
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
