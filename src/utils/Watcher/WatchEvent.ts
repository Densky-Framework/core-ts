export type WatchKind = "create" | "remove" | "modify";

const handledKinds = ["create", "remove", "modify"];

export class WatchEvent {
  static trackingFiles = new Set<string>();

  constructor(
    readonly raw: Deno.FsEvent,
    readonly kind: WatchKind,
    readonly path: string,
  ) {}

  static getWatchEvents(raw: Deno.FsEvent): WatchEvent[] {
    if (!handledKinds.includes(raw.kind)) return [];

    const events: WatchEvent[] = [];

    if (raw.kind === "create") {
      for (const path of raw.paths) {
        const has = this.trackingFiles.has(path);

        if (has) {
          events.push(new WatchEvent(raw, "modify", path));
        } else {
          this.trackingFiles.add(path);
          events.push(new WatchEvent(raw, "create", path));
        }
      }
    } else if (raw.kind === "remove") {
      for (const path of raw.paths) {
        const has = this.trackingFiles.has(path);

        if (has) {
          this.trackingFiles.delete(path);
          events.push(new WatchEvent(raw, "remove", path));
        } else {
          // A strange bug is occurred
        }
      }
    } else {
      // If it's modify, just transform events
      events.push(
        ...(raw.paths.map((path) => new WatchEvent(raw, "modify", path))),
      );
    }

    return events;
  }
}
