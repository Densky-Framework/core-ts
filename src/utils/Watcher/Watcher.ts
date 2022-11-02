import { Watching } from "./Watching.ts";
import { pathMod } from "../../deps.ts";
import { Globals } from "../../globals.ts";

/**
 * A global manager for prevent multiple unnecessary watchers.
 * Just it's a manager, the events are the same as Deno.watchFs
 *
 * @example // Instance watcher
 * const watcher = Watcher.watch("./my-folder");
 *
 * // With for loop
 * for await (const event of watcher) {
 *  console.log("Watch event >>>", event);
 * }
 *
 * // With subscription
 * watcher(event => {
 *  console.log("Watch event >>>", event);
 * });
 *
 * // Stop watching
 * watcher.stop();
 */
export abstract class Watcher {
  static enabled = false;

  /** Watching instance per root */
  static #watchInstances = new Map<string, Set<Watching>>();

  static #globalWatchers = new Map<string, Deno.FsWatcher>();
  static #roots = new Map<string, string>();

  /**
   * Configure root for watchers
   *
   * @example
   * // Handle routes/PATH (ex. routes/products.ts)
   * Watcher.setupRoot("routes", "src/routes");
   * // Handle views/PATH (ex. views/products.html)
   * Watcher.setupRoot("views", "src/views");
   * // Handle static/PATH (ex. static/styles.css)
   * Watcher.setupRoot("static", "src/static");
   */
  static setupRoot(name: string, path: string) {
    this.#roots.set(name, pathMod.resolve(Globals.cwd, path));
  }

  static #getWatcherFromRoot(name: string): Deno.FsWatcher {
    if (!this.#roots.has(name)) {
      throw new Error(
        "Unexpected: Trying to get non-exist root from 'watch' function. INTERNAL",
      );
    }
    if (this.#globalWatchers.has(name)) return this.#globalWatchers.get(name)!;
    if (!this.#watchInstances.has(name)) {
      this.#watchInstances.set(name, new Set());
    }

    const watcher = Deno.watchFs(this.#roots.get(name)!, { recursive: true });
    this.#globalWatchers.set(name, watcher);

    return watcher;
  }

  /**
   * A global manager for prevent multiple unnecessary watchers.
   * Just it's a manager, the events are the same as Deno.watchFs
   *
   * @example // Instance watcher
   * const watcher = Watcher.watch("./my-folder");
   *
   * // With for loop
   * for await (const event of watcher) {
   *  console.log("Watch event >>>", event);
   * }
   *
   * // With subscription
   * watcher(event => {
   *  console.log("Watch event >>>", event);
   * });
   *
   * // Stop watching
   * watcher.stop();
   */
  static watch(path: string): Watching {
    if (!this.enabled) throw new Error("Watcher is disbled");

    // Extract rootName from format "ROOT_NAME/MY/PATH"
    // rootName: ROOT_NAME; path: MY/PATH
    const [rootName, ...pathParts] = path.split(pathMod.sep);
    path = pathParts.join(pathMod.sep);

    if (!this.#roots.has(rootName)) {
      throw new Error(
        "Trying to watch a file from root that doesn't exist. You could forget to setup root 'Watcher.setupRoot' or the name is miswritten",
      );
    }

    const rootPath = this.#roots.get(rootName)!;
    path = pathMod.resolve(rootPath, path);

    const watcher = this.#getWatcherFromRoot(rootName);

    const watching = new Watching(watcher, path);
    this.#watchInstances.get(rootName)!.add(watching);

    return watching;
  }
}

Watcher.setupRoot;
