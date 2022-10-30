import { HttpRouteHandler } from "./HttpRouteHandler.ts";
import { chalk, path } from "../../deps.ts";
import { HTTPMethodStr } from "../../common.ts";
import {Globals} from "../../globals.ts";

/** @internal */
export const errors = {
  EMPTY: chalk`The file is empty or very short {dim (less than 10 characters)}`,
  BAD_EXPORT: `The file isn't export correct class.
The class must be exported as default and will contains the implement of 'IController'`,
  BAD_CODE: "Bad Code. Braces can't be parsed",
};

/** @internal */
export function makeError(relPath: string, error: string): Error {
  return new Error(chalk.dim(`[${relPath}]`) + error);
}

export function handleParser(
  content: string,
  filePath: string,
): HttpRouteHandler[] {
  const relPath = path.relative(Globals.cwd, filePath);
  if (content.length < 10) {
    throw makeError(relPath, errors.EMPTY);
  }

  const handlers: HttpRouteHandler[] = [];

  const classColIndex = content.search(
    /^\s*export\s+default\s+class\s+(.+)\simplements\s+(.*)IController/gm,
  );

  if (classColIndex === -1) {
    throw makeError(relPath, errors.BAD_EXPORT);
  }

  content = content.slice(classColIndex).trim();

  const methodRegex_ = "GET|POST|DELETE|PATH|ANY";
  const methodRegex = new RegExp(methodRegex_);
  // METHOD(REQPARAM: TY): RETURN_TYPE {
  const handlerFnRegex = new RegExp(
    `(${methodRegex_})\\s*\\(\\s*(?:([a-zA-Z0-9_]+):\\s*(?:\\w+)\\s*)?\\)(?:\\s*:\\s*[^{]+\\s*)?\\s*{`,
  );

  const nextHandler = (remain: string) => {
    // Prevent continue if all handlers are filled
    if (handlers.length >= 5) return;

    // Empty file
    if (remain.length <= 0) return;

    // Initial handler search, first search method
    const handlerIdx = remain.search(methodRegex);
    if (handlerIdx === -1) return;

    // Crop from that position
    remain = remain.slice(handlerIdx);

    // second, verify if match with handler declaration
    const match = remain.match(handlerFnRegex);
    if (match === null) return;

    const [str, method, reqParam] = match;
    remain = remain.slice(str.length + 1).trim();

    let braceCount = 1;
    let tmpRemain = remain;
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

    // Set variable only if it's different to "req"
    const reqDecl = reqParam && reqParam !== "req"
      ? `let ${reqParam}: $Densky$.HTTPRequest = req;\n`
      : "";

    const end = reqDecl + remain.slice(0, length - 1).trim();

    handlers.push(
      new HttpRouteHandler(method as HTTPMethodStr, end, reqParam ?? null),
    );

    nextHandler(remain.slice(length));
  };

  nextHandler(content);

  return handlers;
}
