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
}
