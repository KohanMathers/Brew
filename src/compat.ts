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

    var Java: any;
}

const isNode = typeof process !== "undefined" && process.versions?.node;
const isDeno = typeof Deno !== "undefined";
const isJava = typeof Java !== "undefined";

export const compat = {
    args: isDeno && Deno ? Deno.args : isNode ? process.argv.slice(2) : [],

    exit: (code: number): never => {
        if (isDeno && Deno) return Deno.exit(code);
        if (isNode) {
            process.exit(code);
            throw new Error("Process exited");
        }
        throw new Error(`exit(${code}) called in unsupported environment`);
    },

    readTextFile: async (path: string): Promise<string> => {
        if (isDeno && Deno) return await Deno.readTextFile(path);
        if (isNode) {
            const { readFile } = await import("node:fs/promises");
            return await readFile(path, "utf8");
        }
        if (isJava && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            const bytes = Files.readAllBytes(Paths.get(path));
            return new Java.type("java.lang.String")(bytes, "UTF-8");
        }
        throw new Error("readTextFile not supported in this environment");
    },

    writeTextFile: async (path: string, data: string): Promise<void> => {
        if (isDeno && Deno) return await Deno.writeTextFile(path, data);
        if (isNode) {
            const { writeFile } = await import("node:fs/promises");
            await writeFile(path, data);
            return;
        }
        if (isJava && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            const StandardCharsets = Java.type(
                "java.nio.charset.StandardCharsets",
            );
            Files.write(
                Paths.get(path),
                new Java.type("java.lang.String")(data).getBytes(
                    StandardCharsets.UTF_8,
                ),
            );
            return;
        }
        throw new Error("writeTextFile not supported in this environment");
    },

    mkdir: async (path: string): Promise<void> => {
        if (isDeno && Deno) return await Deno.mkdir(path, { recursive: true });
        if (isNode) {
            const { mkdir } = await import("node:fs/promises");
            await mkdir(path, { recursive: true });
            return;
        }
        if (isJava && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            Files.createDirectories(Paths.get(path));
            return;
        }
        throw new Error("mkdir not supported in this environment");
    },
};
