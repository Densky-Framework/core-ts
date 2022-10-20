import { chalk, pathMod } from "../../deps.ts";
import { WsRouteHandler } from "./WsRouteHandler.ts";

/** @internal */
export const errors = {
  NO_DEFAULT: "Don't have default export",
  INVALID_EXPORT: "Invalid export",
  BAD_CODE: "Bad Code. Braces can't be parsed",
};

/** @internal */
export function makeError(filePath: string, error: string): Error {
  return new Error(chalk.dim(`[${filePath}] `) + error);
}

// export default TYPE IDENT(CTX: TY, REQ: TY) RETURN_TYPE {
const handlerRegex =
  /export\s+default\s+function\s+(\w+)\s*\(\s*(?:(\w+)\s*(?::\s*\w+)\s*(?:,\s*(\w+)(?:.*))?)?\)(?:.*)?{/;

export function handleParser(
  content: string,
  filePath: string,
): WsRouteHandler {
  const relPath = pathMod.relative(Deno.cwd(), filePath);

  const idx = content.search(/export\s+default\s+/m);

  if (idx === -1) {
    throw makeError(relPath, errors.NO_DEFAULT);
  }

  content = content.slice(idx);

  const match = content.match(handlerRegex);

  if (!match) {
    throw makeError(relPath, errors.INVALID_EXPORT);
  }

  const [str, _, ctxParam, reqParam] = match;

  content = content.slice(str.length);

  let braceCount = 1;
  let tmpRemain = content;
  let length = 0;

  while (braceCount > 0) {
    const nearCloseBracket = tmpRemain.search("}");
    const nearOpenBracket = tmpRemain.search("{");

    // Both can't be negative
    if (nearCloseBracket === -1 && nearOpenBracket === -1) {
      throw makeError(relPath, errors.BAD_CODE);
    }

    // If 'closeBracket' is more close then substract one to braceCount
    // Open = -1, Close = 0..
    if (
      nearCloseBracket >= 0 &&
      (nearOpenBracket === -1 || nearOpenBracket > nearCloseBracket)
    ) {
      braceCount--;
      length += nearCloseBracket + 1;
      tmpRemain = tmpRemain.slice(nearCloseBracket + 1);
    }

    if (
      nearOpenBracket !== -1 &&
      (nearCloseBracket === -1 || nearOpenBracket < nearCloseBracket)
    ) {
      // else, add one to 'braceCount'
      // Open = 0.., Close = -1..
      braceCount++;
      length += nearOpenBracket + 1;
      tmpRemain = tmpRemain.slice(nearOpenBracket + 1);
    }
  }

  content = content.slice(0, length - 1);

  return new WsRouteHandler(content, ctxParam, reqParam);
}
