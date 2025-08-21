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

const isDeno = typeof Deno !== "undefined";
const isJava = typeof Java !== "undefined";

export const compat = {
    args: isDeno && Deno ? Deno.args : [],

    exit: (code: number): never => {
        if (isDeno && Deno) return Deno.exit(code);
        throw new Error(`exit(${code}) called in unsupported environment`);
    },

    readTextFile: async (path: string): Promise<string> => {
        if (isDeno && Deno) return await Deno.readTextFile(path);
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
        if (isJava && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            Files.createDirectories(Paths.get(path));
            return;
        }
        throw new Error("mkdir not supported in this environment");
    },
};
