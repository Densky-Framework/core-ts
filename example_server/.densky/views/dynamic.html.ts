// deno-lint-ignore-file
/** Densky/dynamic-html **/
import { DenskyHtmlRuntime as __runtime__ } from "densky";

export default function(data: any, __output__: string = ""): string {
  __output__ += "<!doctype html><html lang=en><title>";
  __output__ += __runtime__.escape(__runtime__.stringify(data.title));
  __output__ +=
    '</title><meta charset=UTF-8><meta content="width=device-width,initial-scale=1" name=viewport><body><p>The following text is getted from path params:';
  __output__ += __runtime__.escape(__runtime__.stringify(data.param));
  __output__ += "</p>";
  __output__ += __runtime__.escape(__runtime__.stringify(data.num + 1));
  __output__ += "(Num query param + 1) <p>";
  __output__ += __runtime__.escape(__runtime__.stringify(data.condition));
  __output__ += "</p>";
  if (data.condition) {
    __output__ += "<p>It's TRUE</p>";
  } else {
    __output__ += "<p>It's FALSE</p>";
  }

  return __output__;
}
