import { chalk } from "./chalk.ts";
import { timestamp } from "./utils/timestamp.ts";

export function formatLog(
  msg: string,
  label?: string | null,
  sub?: string | null,
  noTimestamp?: boolean,
): string {
  const ts = noTimestamp ? "" : chalk.dim(timestamp());
  const l = label ? chalk.cyan(label) : "";
  const s = sub ? chalk.green(sub) : "";

  const lg = [ts, chalk.cyan.bold("DENSKY"), l, s, msg].filter(Boolean).join(
    " ",
  );

  return " " + lg;
}

export function log(
  msg: string,
  label?: string | null,
  sub?: string | null,
  noTimestamp?: boolean,
): void {
  console.log(formatLog(msg, label, sub, noTimestamp));
}
