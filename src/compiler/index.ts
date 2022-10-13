import { ChalkInstance } from "https://deno.land/x/chalk_deno@v4.1.1-deno/index.d.ts";
import { chalk } from "../chalk.ts";
import { fs, path as pathMod } from "../deps.ts";
import { RouteFile } from "./RouteFile.ts";
import { RoutesTree } from "./RoutesTree.ts";
import { toResponseFnDecl } from "../utils.ts";

export type CompileOptions = {
  routesPath: string;
  outDir?: string;
  verbose?: boolean;
};

const makeLog = (verbose: boolean, rawStr: string, color: ChalkInstance) => {
  return verbose
    ? (...data: unknown[]) =>
        console.log(
          color(rawStr),
          ...data.map((v) =>
            typeof v === "string"
              ? v.replaceAll("\n", "\n" + " ".repeat(rawStr.length + 1))
              : v
          )
        )
    : (..._: unknown[]) => {};
};

type MakeLogFn = ReturnType<typeof makeLog>;

let log_info: MakeLogFn;
let log_success_v: MakeLogFn;
const log_success: MakeLogFn = makeLog(true, "", chalk.green);
const log_error: MakeLogFn = makeLog(true, "[ERROR]", chalk.red);
const log_warn: MakeLogFn = makeLog(true, "[WARN]", chalk.yellow);

export async function compile(options: CompileOptions) {
  const opts = normalize_options(options);

  if (!(await request_permisions(opts))) return;

  log_info("Scanning files");
  const files = new Map<string, RouteFile>();

  const glob = fs.expandGlob("**/*.ts", {
    root: opts.routesPath,
    globstar: true,
  });

  for await (const file of glob) {
    if (!file.isFile) return;

    const relPath = pathMod.relative(opts.routesPath, file.path);

    if (files.has(relPath)) {
      log_error(`Strange file overlapping with ${file.path}`);
      return;
    }

    const routeFile = new RouteFile(
      file.path,
      pathMod.join(opts.outDir, relPath)
    );

    try {
      routeFile.setFileContent(await Deno.readTextFile(file.path));
    } catch (e) {
      log_warn("(Ignored) " + (e as Error).message);
      continue;
    }

    files.set(relPath.slice(0, -3), routeFile);
  }

  log_success_v("Files count:", files.size);

  const fileRoutesTree = new RoutesTree(
    "/",
    pathMod.join(opts.outDir, "index.ts"),
    null,
    true
  );
  const fileTrees = new Map<string, RoutesTree>();

  const fileEntries = Array.from(files.entries()).sort(([a, _], [b, __]) =>
    a === "index" ? -1 : a.split("/").length - b.split("/").length
  );

  const putFileRecursive = (path: string, tree: RoutesTree) => {
    const fatherRoute = pathMod.dirname(path);
    const fatherRouteTree = fileTrees.get(fatherRoute);

    if (fatherRouteTree) {
      fatherRouteTree.addChild(tree);
    } else {
      const fatherRouteTree = new RoutesTree(
        fatherRoute,
        pathMod.join(opts.outDir, fatherRoute + ".ts"),
        null
      );
      fatherRouteTree.addChild(tree);
      fileTrees.set(fatherRoute, fatherRouteTree);
      putFileRecursive(fatherRoute, fatherRouteTree);
    }

    fileTrees.set(path, tree);
  };

  for (const [path, file] of fileEntries) {
    if (path === "index") {
      fileRoutesTree.routeFile = file;
      fileTrees.set("/", fileRoutesTree);
      continue;
    }

    const currentRouteTree = new RoutesTree(path, file.outPath, file);
    putFileRecursive("/" + path, currentRouteTree);
  }

  // Show route graph

  const showRouteGraph = (route: RoutesTree, prefix = "") => {
    let out = prefix;

    out +=
      route.path === "/"
        ? route.routeFile
          ? "★ "
          : "☆ "
        : route.routeFile
        ? "▲ "
        : "△ ";
    out +=
      // Remove parent path prefix, except at index(/)
      !route.parent || route.parent.path === "/"
        ? route.path
        : route.path.replace(route.parent.path, "");
    out +=
      route.routeFile && route.routeFile.handlers.size > 0
        ? chalk.dim(
            " (" + Array.from(route.routeFile.handlers.keys()).join(", ") + ")"
          )
        : "";

    console.log(out);

    if (route.middleware) {
      console.log(
        prefix + "  ■",
        chalk.gray("middleware"),
        chalk.dim(
          "(" +
            Array.from(route.middleware.routeFile!.handlers.keys()).join(", ") +
            ")"
        )
      );
    }

    for (const child of route.children) {
      showRouteGraph(child, prefix + "  ");
    }

    if (route.fallback) {
      console.log(
        prefix + "  ■",
        chalk.gray("...fallback"),
        chalk.dim(
          "(" +
            Array.from(route.fallback.routeFile!.handlers.keys()).join(", ") +
            ")"
        )
      );
    }
  };

  console.log("Route structure:");
  showRouteGraph(fileRoutesTree);
  console.log("");

  // Legend
  console.log(chalk.gray`★ Root Endpoint (Leaf)`);
  console.log(chalk.gray`☆ Root Invisible (Branch)`);
  console.log(chalk.gray`▲ Endpoint (Leaf)`);
  console.log(chalk.gray`△ Invisible (Branch)`);
  console.log(chalk.gray`■ Convention`);

  log_info("Writing files");

  // Remove old build
  // We use try-catch for handle 'No such file or directory' error
  try {
    await Deno.remove(opts.outDir, { recursive: true });
  } catch (_) {
    void 0;
  }
  await fileRoutesTree.writeFileIncremental();

  {
    // dusky.main.ts
    const mainPath = pathMod.join(opts.outDir, "dusky.main.ts");
    await fs.ensureFile(mainPath);
    await Deno.writeTextFile(
      mainPath,
      `// THIS FILE WAS GENERATED BY DUSKY-BACKEND (By Apika Luca)
import * as $Dusky$ from "dusky";
import { StatusCode } from "dusky/common.ts";
import mainHandler from "./index.ts";

${toResponseFnDecl()}

export default async function requestHandler(req: Deno.RequestEvent, conn: Deno.Conn): Promise<Response> {
  return toResponse(await mainHandler(new $Dusky$.HTTPRequest(req)) ?? new $Dusky$.HTTPError(StatusCode.NOT_FOUND));
}`
    );
  }

  log_success("Done");
}

function normalize_options(options: CompileOptions): Required<CompileOptions> {
  const opts: Required<CompileOptions> = Object.assign(
    {
      routesPath: "",
      outDir: "",
      verbose: false,
    },
    options
  );

  opts.routesPath = new URL(opts.routesPath).pathname;
  opts.outDir = new URL(opts.outDir).pathname;

  log_info = makeLog(opts.verbose, "[INFO]", chalk.cyan);
  log_success_v = makeLog(opts.verbose, "[INFO] ", chalk.green);

  log_info(chalk`Options: 
  RoutesPath: {green "${opts.routesPath}"}
  OutDir: {green "${opts.outDir}"}
  Verbose: {yellow ${opts.verbose}}`);

  return opts;
}

async function request_permisions(
  opts: Required<CompileOptions>
): Promise<boolean> {
  log_info("Prompting permissions");

  const request = async (desc: Deno.PermissionDescriptor, txt: string) => {
    switch ((await Deno.permissions.request(desc)).state) {
      case "granted":
        log_success_v(txt);
        return true;

      case "denied":
        log_error(txt);
        return false;

      default:
        return false;
    }
  };

  const read = (path: string) =>
    request(
      {
        name: "read",
        path: path,
      },
      chalk`Read permission {dim (${path})}`
    );

  const write = (path: string) =>
    request(
      {
        name: "write",
        path: path,
      },
      chalk`Write permission {dim (${path})}`
    );

  if (!(await read(opts.routesPath))) return false;
  if (!(await read(opts.outDir))) return false;
  if (!(await write(opts.outDir))) return false;

  log_success("Granted permissions");

  return true;
}
