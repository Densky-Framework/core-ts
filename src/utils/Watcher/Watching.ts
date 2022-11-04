import { WatchEvent } from "./WatchEvent.ts";

export type WatchingCallback = (event: WatchEvent) => unknown;

export interface Watching {
  (callback: WatchingCallback): () => void;
  subscribe(callback: WatchingCallback): () => void;
  unsubscribe(callback: WatchingCallback): boolean;

  stop(): void;
}

export class Watching extends Function {
  private callbacks = new Set<WatchingCallback>();

  constructor(readonly watcher: Deno.FsWatcher, readonly path: string) {
    super();

    const iterator = watcher[Symbol.asyncIterator]();
    this.#handleLoop(iterator);

    const instance: Watching = this.subscribe.bind(this) as Watching;
    Object.setPrototypeOf(instance, Watching.prototype);
    instance.callbacks = this.callbacks;

    return instance;
  }

  async #handleLoop(iterator: AsyncIterableIterator<Deno.FsEvent>) {
    const event = await iterator.next();
    if (event.done) return;

    const handledEvents = this.#handleEvent(event.value);

    if (handledEvents) {
      handledEvents.forEach(handledEvent => 
      this.callbacks.forEach((callback) => callback(handledEvent)));
    }

    this.#handleLoop(iterator);
  }

  #handleEvent(event: Deno.FsEvent): WatchEvent[] | null {
     const handledPaths = event.paths.filter((path) =>
      path.startsWith(this.path) 
      // Nvim temp files
      && !path.endsWith("~") 
      && !path.endsWith("4913") 
      // Nano temp files
      && !path.endsWith(".swp")
    );

    if (handledPaths.length === 0) return null;

    const events = WatchEvent.getWatchEvents(event);

    if (events.length === 0) return null;

    return events;
  }

  subscribe(callback: WatchingCallback): () => void {
    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  unsubscribe(callback: WatchingCallback): boolean {
    return this.callbacks.delete(callback);
  }

  clear() {
    this.callbacks.clear();
  }

  async *[Symbol.asyncIterator]() {
    // Only return handled events
    for await (const event of this.watcher) {
      const handledEvent = this.#handleEvent(event);
      if (handledEvent) yield handledEvent;
    }
  }
}
