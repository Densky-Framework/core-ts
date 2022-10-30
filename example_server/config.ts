import { CompileOptions } from "densky/compiler.ts";

export const compileOptions: CompileOptions = {
  routesPath: "src/routes",
  wsPath: "src/ws",
  staticPath: "src/static",
  staticPrefix: "/static",
  viewsPath: "src/views",
  verbose: true,
};
