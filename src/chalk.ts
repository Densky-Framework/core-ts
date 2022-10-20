import {
  Chalk,
  supportsColorStderr,
} from "https://deno.land/x/chalk_deno@v4.1.1-deno/source/index.js";
import {
  ChalkInstance,
  Options,
} from "https://deno.land/x/chalk_deno@v4.1.1-deno/index.d.ts";

export const chalk = new Chalk() as ChalkInstance;
export const chalkStderr = new Chalk(
  <Options> {
    level: supportsColorStderr
      ? (supportsColorStderr as { level: number }).level
      : 0,
  },
) as ChalkInstance;
