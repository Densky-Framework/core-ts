import { HTTPError, IController } from "dusky";

export default class OutController implements IController {
  GET() {
    return HTTPError.fromError(new Error("Not Implemented"));
  }
}
