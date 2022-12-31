export class DenskyHtmlRuntime {
  /* Escape HTML Text */
  static escape(data: string): string {
    return data.replaceAll(/[&<>\n"']/g, (ch: string) => {
      return "&" + (({
        ["&"]: "amp",
        ["<"]: "lt",
        [">"]: "gt",
        ["\n"]: "#10",
        ["'"]: "#39",
        ['"']: "quot",
      })[ch] || ch) + ";";
    });
  }

  static stringify(data: unknown): string {
    if (typeof data !== "object") return `${data}`;
    if (data === null) return "null";

    if ("toString" in data && typeof data.toString === "function") {
      return data.toString();
    }

    return JSON.stringify(data, null, 2);
  }
}
