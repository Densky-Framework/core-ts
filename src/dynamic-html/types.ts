export interface DynamicHtmlPart {
  type: "literal" | "eval" | "unescaped" | "block" | "import";
  content: string;
  debug?: {
    line: number;
    column: number;
    filename: string;
  };
}

export interface DynamicHtmlImportPart {
  type: "import";
  content: string;
  filename: string;
  defaultName: string | null;
  imports: string | null;
  debug?: {
    line: number;
    column: number;
    filename: string;
  };
}

export interface DynamicHtml {
  imports: DynamicHtmlImportPart[];
  parts: DynamicHtmlPart[];
}
