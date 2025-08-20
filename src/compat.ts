import { readFile, writeFile, mkdir } from "node:fs/promises";
import { argv, exit } from "node:process";

declare global {
    var Deno:
        | {
              args: string[];
              exit(code: number): never;
              readTextFile(path: string): Promise<string>;
              writeTextFile(path: string, data: string): Promise<void>;
              mkdir(
                  path: string,
                  options?: { recursive?: boolean },
              ): Promise<void>;
          }
        | undefined;
}

export const compat = {
    args:
        typeof globalThis.Deno !== "undefined" && globalThis.Deno
            ? globalThis.Deno.args
            : argv.slice(2),
    exit: (code: number): never => {
        if (typeof globalThis.Deno !== "undefined" && globalThis.Deno) {
            return globalThis.Deno.exit(code);
        } else {
            exit(code);
            throw new Error("Process exited");
        }
    },
    readTextFile: async (path: string): Promise<string> =>
        typeof globalThis.Deno !== "undefined" && globalThis.Deno
            ? await globalThis.Deno.readTextFile(path)
            : await readFile(path, "utf8"),
    writeTextFile: async (path: string, data: string): Promise<void> => {
        if (typeof globalThis.Deno !== "undefined" && globalThis.Deno) {
            await globalThis.Deno.writeTextFile(path, data);
        } else {
            await writeFile(path, data);
        }
    },
    mkdir: async (path: string): Promise<void> => {
        if (typeof globalThis.Deno !== "undefined" && globalThis.Deno) {
            await globalThis.Deno.mkdir(path, { recursive: true });
        } else {
            await mkdir(path, { recursive: true });
        }
    },
};
