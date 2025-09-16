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
              statSync(path: string): { isFile: boolean; isDirectory: boolean };
              readTextFileSync(path: string): string;
              readDir(path: string): AsyncIterable<{ name: string; isDirectory: boolean }>;
              remove(path: string): Promise<void>;
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

    existsSync: (path: string): boolean => {
        if (isDeno && Deno) {
            try {
                Deno.statSync(path);
                return true;
            } catch {
                return false;
            }
        }
        if (isJava && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            return Files.exists(Paths.get(path));
        }
        throw new Error("existsSync not supported in this environment");
    },

    readFileSync: (path: string, encoding?: string): string => {
        if (isDeno && Deno) {
            return Deno.readTextFileSync(path);
        }
        if (isJava && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            const bytes = Files.readAllBytes(Paths.get(path));
            return new Java.type("java.lang.String")(bytes, "UTF-8");
        }
        throw new Error("readFileSync not supported in this environment");
    },

    getDirectoryEntries: async (dirPath: string): Promise<Array<{name: string, isDirectory: boolean}>> => {
        if (typeof Deno !== "undefined" && Deno) {
            const entries = [];
            for await (const entry of Deno.readDir(dirPath)) {
                entries.push({
                    name: entry.name,
                    isDirectory: entry.isDirectory
                });
            }
            return entries;
        }
        
        if (typeof Java !== "undefined" && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            const path = Paths.get(dirPath);
            const stream = Files.list(path);
            const entries = [];
            
            const iterator = stream.iterator();
            while (iterator.hasNext()) {
                const entry = iterator.next();
                const fileName = entry.getFileName().toString();
                const isDir = Files.isDirectory(entry);
                entries.push({
                    name: fileName,
                    isDirectory: isDir
                });
            }
            stream.close();
            return entries;
        }
        
        throw new Error("getDirectoryEntries not supported in this environment");
    },

    /**
     * Removes a single file
     */
    removeFile: async (filePath: string): Promise<void> => {
        if (typeof Deno !== "undefined" && Deno) {
            await Deno.remove(filePath);
            return;
        }
        
        if (typeof Java !== "undefined" && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            Files.delete(Paths.get(filePath));
            return;
        }
        
        throw new Error("removeFile not supported in this environment");
    },

    /**
     * Removes an empty directory
     */
    removeDirOnly: async (dirPath: string): Promise<void> => {
        if (typeof Deno !== "undefined" && Deno) {
            await Deno.remove(dirPath);
            return;
        }
        
        if (typeof Java !== "undefined" && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            Files.delete(Paths.get(dirPath));
            return;
        }
        
        throw new Error("removeDirOnly not supported in this environment");
    }
};