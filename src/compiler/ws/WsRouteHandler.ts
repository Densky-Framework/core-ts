export class WsRouteHandler {
  constructor(
    public body: string,
    public ctxParam?: string,
    public reqParam?: string,
  ) {}
}
