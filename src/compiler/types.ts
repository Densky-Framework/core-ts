export type CompileOptions = {
  routesPath: string;
  wsPath?: string | false;
  staticPath?: string | false;
  staticPrefix?: string;
  viewsPath?: string | false;
  outDir?: string;
  verbose?: boolean;
};
