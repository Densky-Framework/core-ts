import { CompileOptions } from "densky/compiler.ts";

const pathname = new URL(import.meta.resolve("./")).pathname;
Deno.env.set("CWD", pathname);

console.log("Running in " + pathname);

export const compileOptions: CompileOptions = {
  routesPath: "src/routes",
  wsPath: "src/ws",
  staticPath: "src/static",
  staticPrefix: "/static",
  viewsPath: "src/views",
  verbose: true,
};
