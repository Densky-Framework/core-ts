import mimeTypes from "./list.ts";

const types: Record<string, string> = {};
const extensions: Record<string, string> = {};

function define(typeMap: Record<string, string[]>, force = false) {
  for (let type in typeMap) {
    const typeExtensions = typeMap[type].map((t) => t.toLowerCase());
    type = type.toLowerCase();

    for (const ext of typeExtensions) {
      if (ext[0] === "*") {
        continue;
      }

      if (!force && ext in types) {
        throw new Error(
          `Attempt to change mapping for "${ext}" extension from "${
            types[ext]
          }" to "${type}". Pass 'force = true' to allow this, otherwise remove "${ext}" from the list of extensions for "${type}".`,
        );
      }

      types[ext] = type;
    }

    if (force || !extensions[type]) {
      const ext = typeExtensions[0];
      if (!ext) throw new Error(`Extension isn't valid for type '${type}'`);
      extensions[type] = ext[0] !== "*" ? ext : ext.substring(1);
    }
  }
}

function getMimeType(ext: string): string | null {
  return types[ext] || null;
}

function getExtension(type: string): string | null {
  const matchedType = /^\s*([^;\s]*)/.exec(type)?.[1];
  return (matchedType && extensions[matchedType.toLowerCase()]) || null;
}

define(mimeTypes);

const mime = {
  define,
  getExtension,
  getMimeType,
};

export default mime;
export { define, getExtension, getMimeType, mime as __moduleExports };
