import { DynamicHtmlPart } from "./types.ts";

/* ----------- *\
  PREFIX
    ▼
   {@ EXPR }
   ▲       ▲
   DELIMITER
\* ----------- */
const OPEN_DELIMITER = "{";
const CLOSE_DELIMITER = "}";

const UNESCAPED_PREFIX = "@";
const OPEN_BLOCK_PREFIX = "!";
const CLOSE_BLOCK_PREFIX = "/";
const BLOCK_PREFIX = "#";
const IMPORT_PREFIX = "$";
// const INCLUDE_PREFIX = "^";

const typesMap: { [x: string]: DynamicHtmlPart["type"] } = {
  [UNESCAPED_PREFIX]: "unescaped",
  [OPEN_BLOCK_PREFIX]: "block",
  [CLOSE_BLOCK_PREFIX]: "block",
  [BLOCK_PREFIX]: "block",
  [IMPORT_PREFIX]: "import",
  // [INCLUDE_PREFIX]: "include",
};

export function parseDynamicHtml(content: string): DynamicHtmlPart[] {
  let isOpen = false;
  let lastIndex = 0;
  const parts: DynamicHtmlPart[] = [];

  while (lastIndex < content.length) {
    if (isOpen) {
      const closeIndex = searchDelimiter(
        CLOSE_DELIMITER,
        lastIndex,
        content,
      );
      if (closeIndex !== -1) {
        const expr = content.substring(lastIndex, closeIndex);
        const part = handleExpression(expr);
        if (part) {
          parts.push(part);
        }

        isOpen = false;
        lastIndex = closeIndex + CLOSE_DELIMITER.length;
      } else {
        break;
      }
    }

    const openIndex = searchDelimiter(
      OPEN_DELIMITER,
      lastIndex,
      content,
    );
    if (openIndex !== -1) {
      const literal = content.substring(lastIndex, openIndex).trim();
      if (literal.length !== 0) {
        parts.push({
          type: "literal",
          content: literal,
        });
      }
      isOpen = true;
      lastIndex = openIndex + OPEN_DELIMITER.length;
    } else {
      break;
    }
  }

  return parts;
}

function searchDelimiter(
  delimiter: string,
  lastIndex: number,
  content: string,
): number {
  let tmpIndex = lastIndex;
  while (tmpIndex < content.length) {
    const index = content.indexOf(delimiter, tmpIndex);
    const notFounded = index === -1;
    if (notFounded) return -1;

    const isInitialChar = index === 0;
    if (isInitialChar) return 0;

    // When the char before the delimiter is `\`
    // then skip it
    const beforeChar = content[index - 1];
    if (beforeChar === "\\") {
      tmpIndex = index + delimiter.length;
      continue;
    }

    return index;
  }

  return -1;
}


function handleExpression(expr: string): DynamicHtmlPart | null {
    const trimmed = expr.trim();
  const prefix = expr[0];
  // Get type from declared prefixes
  const type = typesMap[prefix] ?? "eval";

  // The CLOSE_BLOCK_PREFIX has special output,
  // always is a block with "}" as content
  if (prefix === CLOSE_BLOCK_PREFIX) {
    const content = trimmed.length > 1
      ? `} ${trimmed.slice(1).trimStart()} {`
      : "}";
    return { type, content };
  }

  expr = type === "eval" ? trimmed : trimmed.slice(1);
  expr = expr.trimStart();

  if (expr.length === 0) return null;

  if (prefix === OPEN_BLOCK_PREFIX) expr += " {";

  return {
    type: type,
    content: expr,
  };
}
