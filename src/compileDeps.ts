import init, {
  minify as minifier,
} from "https://wilsonl.in/minify-html/deno/0.10.7/index.js";

await init();

export function minify(html: string) {
  return new TextDecoder().decode(minifier(new TextEncoder().encode(html), {
    keep_spaces_between_attributes: true,
    keep_comments: true,
    do_not_minify_doctype: true,
    ensure_spec_compliant_unquoted_attribute_values: true,
  }));
}
