import { CompileOptions } from "dusky/compiler.ts";

export const routesPath = import.meta.resolve("./src/routes");
export const outdirPath = import.meta.resolve("./.dusky");

export const compileOptions: CompileOptions = {
  routesPath: "src/routes",
  verbose: true,
};
