import { CompileOptions } from "densky/compiler.ts";

export const routesPath = "src/routes";

export const compileOptions: CompileOptions = {
  routesPath: "src/routes",
  wsPath: "src/ws",
  staticPath: "src/static",
  staticPrefix: "/static",
  verbose: true,
};
