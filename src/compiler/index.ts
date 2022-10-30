import { chalk, fs, path } from "../deps.ts";
import { graphHttpToTerminal, graphWsToTerminal } from "./grapher/terminal.ts";
import {
  log_error,
  log_success,
  makeLog_info,
  makeLog_success_v,
  MakeLogFn,
} from "./logger.ts";
import { CompileOptions } from "./types.ts";
import { httpDiscover } from "./http/discover.ts";
import { httpWrite } from "./http/write.ts";
import { wsDiscover } from "./ws/discover.ts";
import { wsWrite } from "./ws/write.ts";
import { format } from "./formatter.ts";
import { staticDiscover } from "./static/discover.ts";
import { staticWrite } from "./static/write.ts";

export type { CompileOptions };

let log_info: MakeLogFn;
let log_success_v: MakeLogFn;

export async function compile(options: CompileOptions) {
  const opts = normalize_options(options);

  if (!(await request_permisions(opts))) return;

  const httpRoutesTree = await httpDiscover(opts);
  const wsRoutesTree = await wsDiscover(opts);
  const staticRoutesTree = await staticDiscover(opts);

  if (!httpRoutesTree) return;
  if (opts.wsPath && !wsRoutesTree) return;
  if (opts.staticPath && !staticRoutesTree) return;

  log_info("Writing files");

  // Remove old build
  // We use try-catch for handle 'No such file or directory' error
  try {
    await Deno.remove(opts.outDir, { recursive: true });
  } catch (_) {
    void 0;
  }

  // Write
  await httpWrite(httpRoutesTree, opts);
  if (wsRoutesTree) await wsWrite(wsRoutesTree, opts);
  if (staticRoutesTree) await staticWrite(staticRoutesTree, opts);

  {
    const hasWs = !!opts.wsPath;
    const hasStatic = !!opts.staticPath;
    const mainPath = path.join(opts.outDir, "main.ts");
    await fs.ensureFile(mainPath);
    const content =
      `// THIS FILE WAS GENERATED BY DENSKY-BACKEND (By Apika Luca)
import * as $densky$ from "densky";
import httpHandler from "./http.main.ts";
${hasWs ? "import wsHandler from './ws.main.ts'" : ""}
${hasStatic ? "import staticHandler from './static.main.ts'" : ""}

export default async function requestHandler(request: Deno.RequestEvent, conn: Deno.Conn): Promise<Response> {
  const req = new $densky$.HTTPRequest(request);

  ${
        hasStatic
          ? `
  const staticRes = await staticHandler(req);
  if (staticRes) return staticRes;`
          : ""
      }

  ${
        hasWs
          ? `
  const wsRes = await wsHandler(req);
  if (wsRes) return wsRes;`
          : ""
      }

  return await httpHandler(req);
}`;

    await Deno.writeTextFile(mainPath, format(mainPath, content));
  }

  // Show route graph
  console.log("Http route structure:");
  graphHttpToTerminal(httpRoutesTree);
  console.log("");

  if (wsRoutesTree) {
    console.log("WebSocket route structure:");
    graphWsToTerminal(wsRoutesTree);
    console.log("");
  }

  // Legend
  console.log(chalk.gray`★ Root Endpoint (Leaf)`);
  console.log(chalk.gray`☆ Root Invisible (Branch)`);
  console.log(chalk.gray`▲ Endpoint (Leaf)`);
  console.log(chalk.gray`△ Invisible (Branch)`);
  console.log(chalk.gray`■ Convention`);

  log_success("Done");
}

function normalize_options(options: CompileOptions): Required<CompileOptions> {
  const opts: Required<CompileOptions> = Object.assign(
    {
      routesPath: "",
      wsPath: false,
      staticPath: false,
      staticPrefix: "/static",
      outDir: ".densky",
      verbose: false,
    },
    options,
  );

  opts.routesPath = path.resolve(Deno.cwd(), opts.routesPath);
  opts.outDir = path.resolve(Deno.cwd(), opts.outDir);
  if (opts.wsPath) opts.wsPath = path.resolve(Deno.cwd(), opts.wsPath);
  if (opts.staticPath) {
    opts.staticPath = path.resolve(Deno.cwd(), opts.staticPath);
  }

  log_info = makeLog_info(opts.verbose);
  log_success_v = makeLog_success_v(opts.verbose);

  log_info(chalk`Options: 
  RoutesPath: {green "${opts.routesPath}"}
  WsPath: {green ${opts.wsPath ? '"' + opts.wsPath + '"' : "false"}}
  StaticPath: {green ${opts.staticPath ? '"' + opts.staticPath + '"' : "false"}}
  StaticPrefix: {green "${opts.staticPrefix}"}
  OutDir: {green "${opts.outDir}"}
  Verbose: {yellow ${opts.verbose}}`);

  return opts;
}

/** Persmission request helper */
async function request(desc: Deno.PermissionDescriptor, txt: string) {
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
}

async function request_permisions(
  opts: Required<CompileOptions>,
): Promise<boolean> {
  log_info("Prompting permissions");

  const read = (path: string) =>
    request(
      {
        name: "read",
        path: path,
      },
      chalk`Read permission {dim (${path})}`,
    );

  const write = (path: string) =>
    request(
      {
        name: "write",
        path: path,
      },
      chalk`Write permission {dim (${path})}`,
    );

  if (!(await read(opts.routesPath))) return false;
  if (!(await read(opts.outDir))) return false;
  if (!(await write(opts.outDir))) return false;

  log_success("Granted permissions");

  return true;
}
