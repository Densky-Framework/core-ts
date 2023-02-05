// deno-lint-ignore-file
/** Densky/dynamic-html **/
import { DenskyHtmlRuntime as __runtime__ } from "densky";

export default function(data: any, __output__: string = ""): string {
  __output__ +=
    '<!doctype html><html lang=en><title>Deno Backend</title><meta charset=UTF-8><meta content="width=device-width,initial-scale=1" name=viewport><link href=/static/styles.css rel=stylesheet><body><h1 class=center>Deno Backend View</h1><a href=/feats/cookies> See all your cookies </a><span class=copyright> Copyright (c) 2022 Apika Luca. All Rights Reserved. </span>';

  return __output__;
}
