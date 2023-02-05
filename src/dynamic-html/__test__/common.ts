import { DynamicHtmlPart } from "../types.ts";

const template = (type: DynamicHtmlPart["type"]) => (content: string) => ({
  type,
  content,
});
export const literal = template("literal");
export const block = template("block");
export const import_ = template("import");
export const eval_ = template("eval");
