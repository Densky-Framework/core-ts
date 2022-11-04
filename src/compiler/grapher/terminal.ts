import { chalk } from "../../deps.ts";
import { HttpRoutesTree } from "../http/HttpRoutesTree.ts";
import { WsRoutesRoot } from "../ws/WsRoutesRoot.ts";
import { WsRoutesTree } from "../ws/WsRoutesTree.ts";

export function graphHttpToTerminal(
  route: HttpRoutesTree,
  prefix = "  ",
): void {
  let out = prefix;

  out += route.urlPath === "/"
    ? route.routeFile ? "★ " : "☆ "
    : route.routeFile
    ? "▲ "
    : "△ ";
  out += (route.routeFile ? chalk.bold : chalk.reset)(
    // Remove parent path prefix, except at index(/)
    !route.parent || route.parent.urlPath === "/"
      ? route.urlPath
      : route.urlPath.replace(route.parent.urlPath, ""),
  );

  out += route.routeFile && route.routeFile.handlers.size > 0
    ? chalk.dim(
      " (" + Array.from(route.routeFile.handlers.keys()).join(", ") + ")",
    )
    : "";

  console.log(out);

  if (route.middleware) {
    console.log(
      prefix + chalk.dim("|") + " ■",
      chalk.gray("middleware"),
      chalk.dim(
        "(" +
          Array.from(route.middleware.routeFile!.handlers.keys()).join(", ") +
          ")",
      ),
    );
  }

  for (const child of route.children) {
    graphHttpToTerminal(child, prefix + chalk.dim("| "));
  }

  if (route.fallback) {
    console.log(
      prefix + chalk.dim("|") + " ■",
      chalk.gray("...fallback"),
      chalk.dim(
        "(" +
          Array.from(route.fallback.routeFile!.handlers.keys()).join(", ") +
          ")",
      ),
    );
  }
}

export function graphWsToTerminal(route: WsRoutesTree, prefix = ""): void {
  let out = prefix;

  out += route.urlPath === "/"
    ? route.routeFile ? "★ " : "☆ "
    : route.routeFile
    ? "▲ "
    : "△ ";

  out +=
    // Remove parent path prefix, except at index(/)
    !route.parent || route.parent.urlPath === "/"
      ? route.urlPath
      : route.urlPath.replace(route.parent.urlPath, "");

  console.log(out);

  if (route.isRoot) {
    const root = route as WsRoutesRoot;
    if (root.connectFile) {
      console.log(prefix + chalk.dim("|") + " ■", chalk.gray("connect"));
    }

    if (root.disconectFile) {
      console.log(prefix + chalk.dim("|") + " ■", chalk.gray("disconect"));
    }
  }

  if (route.middleware) {
    console.log(
      prefix + chalk.dim("|") + " ■",
      chalk.gray("middleware"),
    );
  }

  for (const child of route.children) {
    graphWsToTerminal(child, prefix + chalk.dim("| "));
  }

  if (route.fallback) {
    console.log(
      prefix + chalk.dim("|") + " ■",
      chalk.gray("...fallback"),
    );
  }
}
