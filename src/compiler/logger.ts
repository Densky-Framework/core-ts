import { ChalkInstance } from "https://deno.land/x/chalk_deno@v4.1.1-deno/index.d.ts";
import { chalk } from "../deps.ts";

export const makeLog = (
  verbose: boolean,
  rawStr: string,
  color: ChalkInstance,
) => {
  return verbose
    ? (...data: unknown[]) =>
      console.log(
        color(rawStr),
        ...data.map((v) =>
          typeof v === "string"
            ? v.replaceAll("\n", "\n" + " ".repeat(rawStr.length + 1))
            : v
        ),
      )
    : (..._: unknown[]) => {};
};

export type MakeLogFn = ReturnType<typeof makeLog>;

export const makeLog_info = (verbose: boolean): MakeLogFn =>
  makeLog(verbose, "[INFO]", chalk.cyan);
export const makeLog_success_v = (verbose: boolean): MakeLogFn =>
  makeLog(verbose, "[INFO] ", chalk.green);
export const log_success: MakeLogFn = makeLog(true, "", chalk.green);
export const log_error: MakeLogFn = makeLog(true, "[ERROR]", chalk.red);
export const log_warn: MakeLogFn = makeLog(true, "[WARN]", chalk.yellow);
