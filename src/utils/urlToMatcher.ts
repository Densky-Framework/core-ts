export interface UrlMatcher {
  exact(target: string, params: Map<string, string>): boolean;
  exactDecl(target: string, params: string): string;
  start(target: string): boolean;
  startDecl(target: string): string;
  prepareDecl(target: string, val: string): string;
  serialDecl(target: string): string;
}

export type UrlMatcherPart =
  | {
    raw: string;
    isVar: false;
    varname?: string;
  }
  | {
    raw: string;
    isVar: true;
    varname: string;
  };

export function urlToMatcher(url: string): UrlMatcher {
  const parts = getUrlMatcherParts(url);
  const hasVariables = parts.some((part) => part.isVar);

  if (hasVariables) {
    const partsSerialized = JSON.stringify(parts);

    return {
      exact(target, params) {
        const targetParts = target.split("/");
        targetParts.shift();
        // Remove last if it's empty, handle "/my/path/"
        last_empty: {
          const last = targetParts.pop();
          if (last === undefined || last.length === 0) break last_empty;

          targetParts.push(last);
        }

        if (targetParts.length !== parts.length) return false;

        params.clear();
        return targetParts.every((part, index) => {
          if (!parts[index]) return false;

          if (parts[index].isVar) {
            params.set(parts[index].varname!, part);
            return true;
          }

          if (parts[index].raw === part) return true;

          return false;
        });
      },
      exactDecl(target, params) {
        return `(() => {
          const t = urlMatcherPrepare_${target};
          const p = urlMatcherSerial_${target};
          const m = ${params};

          if (t.length !== p.length) return false;
          m.clear();
          return t.every((tp,i) => {
            if (!p[i]) return false;
            if (p[i].isVar) {
              m.set(p[i].varname,tp);
              return true;
            }
            if (p[i].raw === tp) return true;
            return false;
          });
        })()`;
      },
      start(target) {
        const targetParts = target.split("/");
        targetParts.shift();
        // Remove last if it's empty, handle "/my/path/"
        last_empty: {
          const last = targetParts.pop();
          if (last === undefined || last.length === 0) break last_empty;

          targetParts.push(last);
        }

        if (targetParts.length < parts.length) return false;

        return parts.every((part, index) => {
          if (!targetParts[index]) return false;

          if (part.isVar) return true;

          if (part.raw === targetParts[index]) return true;

          return false;
        });
      },
      startDecl(target) {
        return `(() => {
          const t = urlMatcherPrepare_${target};
          const p = urlMatcherSerial_${target};

          if (t.length < p.length) return false;
          return p.every((tp,i) => {
            if (!t[i]) return false;
            if (tp.isVar) return true;
            if (tp.raw === t[i]) return true;
            return false;
          });
        })()`;
      },
      prepareDecl(target, val) {
        return `const urlMatcherPrepare_${target}=${val}.byParts;`;
      },

      serialDecl(target) {
        return `const urlMatcherSerial_${target} = ${partsSerialized};`;
      },
    };
  }

  return {
    exact(target) {
      return target === url;
    },
    exactDecl(target) {
      return "urlMatcherPrepare_" + target + " === '" + url + "'";
    },
    start(target) {
      return target.startsWith(url);
    },
    startDecl(target) {
      return "urlMatcherPrepare_" + target + ".startsWith('" + url + "')";
    },
    prepareDecl(target, val) {
      return `const urlMatcherPrepare_${target} = ${val}.pathname;`;
    },
    serialDecl(_target) {
      return "";
    },
  };
}

export function getUrlMatcherParts(url: string): UrlMatcherPart[] {
  const rawPathParts = url.split("/");
  // Remove first slash, it's empty, handle "/my/path"
  rawPathParts.shift();

  // Remove last if it's empty, handle "/my/path/"
  last_empty: {
    const last = rawPathParts.pop();
    if (last === undefined || last.length === 0) break last_empty;

    rawPathParts.push(last);
  }

  const pathParts: UrlMatcherPart[] = rawPathParts.map((part) => {
    // A part just can be static or var.
    // Can't be botch like '/user_[id]', that must be '/user/[id]'
    // or be handled in request like
    // '/[userId]' -> user_1 -> (Regex, slice or something) -> 1
    const isVar = part[0] === "[" && part[part.length - 1] === "]";

    if (isVar) {
      return {
        raw: part,
        isVar,
        varname: part.slice(1, -1),
      };
    }

    return {
      raw: part,
      isVar,
    };
  });

  return pathParts;
}
