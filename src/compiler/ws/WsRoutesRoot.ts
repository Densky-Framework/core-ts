import { pathMod } from "../../deps.ts";
import { WsRoutesTree } from "./WsRoutesTree.ts";

export class WsRoutesRoot extends WsRoutesTree {
  connectFile: WsRoutesTree | null = null;
  disconectFile: WsRoutesTree | null = null;

  override handleConvention(name: string, route: WsRoutesTree): boolean {
    switch (name) {
      case "connect":
        this.connectFile = route;
        return true;

      case "disconect":
        this.disconectFile = route;
        return true;

      default:
        return false;
    }
  }

  override generateImports(): string {
    let imports = super.generateImports();

    if (this.connectFile) {
      imports += `\nimport $connectHandler$ from "./${
        pathMod.relative(this.dirname, this.connectFile.filePath)
      }"`;
    }

    if (this.disconectFile) {
      imports += `\nimport $disconectHandler$ from "./${
        pathMod.relative(this.dirname, this.disconectFile.filePath)
      }"`;
    }

    return imports;
  }

  override generateBodyContent(): string {
    const [ctx, sock] = this.getParamNames();

    return `
const raw = ${sock}.raw;
raw.onopen = () => {
  ${ctx}.queueSockets.delete(${sock});
  const id = ${ctx}.addSocket(${sock});

  ${sock}.sendRaw($Dusky$.SocketMessageEnum.DENSKY_CONNECT, id);
  // Compatiblity for router, this is more simple than
  // try to changer the router
  ${ctx}.req.pathname = "/_connect";
  ${this.connectFile ? `$connectHandler$(${ctx}, ${sock})` : ""}
}
raw.onmessage = (e) => {
  console.log(e);
}
raw.onclose = (e) => {
  ${ctx}.sockets.delete(${sock}.id);
  // Compatiblity for router, this is more simple than
  // try to changer the router
  ${ctx}.req.pathname = "/_disconect";
  ${this.disconectFile ? `$disconectHandler$(${ctx}, ${sock})` : ""}
}
    `;
  }

  override async writeFileIncremental(): Promise<void> {
    await super.writeFileIncremental();

    if (this.connectFile) await this.connectFile.writeFile();
    if (this.disconectFile) await this.disconectFile.writeFile();
  }
}
