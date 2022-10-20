import { chalk } from "../../deps.ts";
import { HttpRoutesTree } from "../http/HttpRoutesTree.ts";

export function graphToTerminal(route: HttpRoutesTree, prefix = ""): void {
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
    graphToTerminal(child, prefix + chalk.dim("| "));
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
