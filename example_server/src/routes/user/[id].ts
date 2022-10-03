import { IController } from "dusky";

export default class UserController implements IController {
  GET() {
    return new Response("USER");
  }
}
