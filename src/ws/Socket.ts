import { PrimitiveObject } from "../common.ts";
import { SocketMessageEnum, SocketMessageType } from "./common.ts";

type SocketNormalMessage =
  | SocketMessageEnum.DENSKY_MESSAGE
  | SocketMessageEnum.MESSAGE;

export class Socket {
  private _id: string | null = null;

  get id(): string {
    if (!this._id) {
      throw new Error(
        "The id is not assigned. You was trying to get it before the connect is stablished",
      );
    }
    return this._id;
  }
  protected set id(id: string) {
    this._id = id;
  }

  constructor(readonly raw: WebSocket) {}

  /**
   * This will change id and might break references
   * @internal
   */
  setId(id: string) {
    this._id = id;
  }

  protected sendArrayBuffer(...parts: (number | string)[]) {
    const rawParts = parts.flatMap((val) => {
      if (typeof val === "number") return val;

      const chars: number[] = [];

      for (const char of val) {
        chars.push(char.charCodeAt(0));
      }

      return chars;
    });
    const arrayBuffer = new Int16Array(rawParts);

    this.raw.send(arrayBuffer);
  }

  sendRaw(type: SocketMessageEnum.DENSKY_CONNECT, targetId: string): void;
  sendRaw(type: SocketMessageEnum.DENSKY_DISCONNECT): void;
  sendRaw(
    type: SocketNormalMessage,
    messageType: SocketMessageType.String,
    message: string,
  ): void;
  sendRaw(
    type: SocketNormalMessage,
    messageType: SocketMessageType.Number,
    message: number,
  ): void;
  sendRaw(
    type: SocketNormalMessage,
    messageType: SocketMessageType.Boolean,
    message: boolean,
  ): void;
  sendRaw(
    type: SocketNormalMessage,
    messageType: SocketMessageType.Json,
    message: PrimitiveObject,
  ): void;
  sendRaw(
    type: SocketNormalMessage,
    message: unknown,
    _message?: unknown,
  ): void;

  sendRaw(
    type: SocketMessageEnum,
    _messageTypeOrId?: unknown,
    _message?: unknown,
  ) {
    switch (type) {
      case SocketMessageEnum.DENSKY_CONNECT: {
        const targetId = _messageTypeOrId as string;

        if (typeof targetId !== "string") {
          throw new TypeError(
            "targetId must be string, but is " + typeof targetId,
          );
        }

        this.sendArrayBuffer(type, targetId);
        break;
      }

      case SocketMessageEnum.DENSKY_DISCONNECT:
        this.sendArrayBuffer(type);
        break;

      case SocketMessageEnum.DENSKY_MESSAGE:
      case SocketMessageEnum.MESSAGE: {
        const messageType = _messageTypeOrId!;
        const message = _message;

        if (typeof messageType !== "number") {
          this.sendArrayBuffer(type, `${messageType}`);
          break;
        }

        switch (messageType as SocketMessageType) {
          case SocketMessageType.Boolean:
            this.sendArrayBuffer(type, messageType, message ? 1 : 0);
            break;

          case SocketMessageType.Number:
            this.sendArrayBuffer(type, messageType, message as number);
            break;

          case SocketMessageType.String:
            this.sendArrayBuffer(type, messageType, message as string);
            break;

          case SocketMessageType.Json:
            this.sendArrayBuffer(type, messageType, JSON.stringify(message));
            break;

          default:
            this.sendArrayBuffer(type, `${messageType}`);
            break;
        }

        break;
      }

      default:
        throw new Error("Unexpected send type: " + type);
    }
  }

  send(messageType: SocketMessageType.String, message: string): void;
  send(messageType: SocketMessageType.Number, message: number): void;
  send(messageType: SocketMessageType.Boolean, message: boolean): void;
  send(messageType: SocketMessageType.Json, message: PrimitiveObject): void;
  send(message: unknown): void;

  send(_messageTypeOrMessage: unknown, _message?: unknown) {
    this.sendRaw(SocketMessageEnum.MESSAGE, _messageTypeOrMessage, _message);
  }
}
