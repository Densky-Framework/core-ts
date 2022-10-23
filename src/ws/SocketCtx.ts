import { Socket } from "./Socket.ts";
import { generateId } from "./generateId.ts";
import { HTTPRequest } from "../http/index.ts";

export class SocketCtx {
  // Just for scope
  req!: HTTPRequest;

  sockets = new Map<string, Socket>();

  queueSockets = new Set<Socket>();

  addSocket(socket: Socket): string {
    const id = generateId();

    socket.setId(id);
    this.sockets.set(id, socket);

    return id;
  }
}
