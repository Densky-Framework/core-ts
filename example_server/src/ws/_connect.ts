import {SocketCtx, Socket} from "dusky"

export default function connect(_: SocketCtx, socket: Socket) {
  console.log("Socket is connected:", socket.id)
}
