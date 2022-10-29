export type CompileOptions = {
  routesPath: string;
  wsPath?: string | false;
  staticPath?: string | false;
  staticPrefix?: string;
  outDir?: string;
  verbose?: boolean;
};
