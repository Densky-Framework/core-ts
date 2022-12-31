export class DynamicHtmlTree {
  tree: Map<string, DynamicHtmlTreeNode> = new Map();

  constructor() {}
}

export class DynamicHtmlTreeNode {
  constructor(
    public readonly filePath: string,
    public render?: (data: unknown) => string,
  ) {}
}
