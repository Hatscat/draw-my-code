// The only Node global the tests need. Declared here instead of adding @types/node.
declare const process: { env: Record<string, string | undefined> };
