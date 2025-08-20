import { readFile, writeFile, readdir, stat, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface BuildOptions {
    srcDir: string;
    outDir: string;
    tempDir: string;
}

class BrewBuilder {
    private options: BuildOptions;

    constructor(options: BuildOptions) {
        this.options = options;
    }

    async build(): Promise<void> {
        console.log("Starting Brew build process...");
        await this.ensureDirectories();
        await this.copyAndTransformSources();
        await this.runTypeScriptCompiler();
        await this.cleanup();

        console.log("Build complete!");
    }

    private async ensureDirectories(): Promise<void> {
        try {
            await mkdir(this.options.tempDir, { recursive: true });
            await mkdir(this.options.outDir, { recursive: true });
        } catch (_error) {
            // Directories might already exist, that's okay
        }
    }

    private async copyAndTransformSources(): Promise<void> {
        console.log("Transforming source files...");
        await this.processDirectory(this.options.srcDir, this.options.tempDir);
    }

    private async processDirectory(
        srcDir: string,
        destDir: string,
    ): Promise<void> {
        const entries = await readdir(srcDir);

        for (const entry of entries) {
            const srcPath = join(srcDir, entry);
            const destPath = join(destDir, entry);
            const stats = await stat(srcPath);

            if (stats.isDirectory()) {
                await mkdir(destPath, { recursive: true });
                await this.processDirectory(srcPath, destPath);
            } else if (entry.endsWith(".ts")) {
                await this.transformTypeScriptFile(srcPath, destPath);
            } else {
                // Copy non-TypeScript files as-is
                const content = await readFile(srcPath);
                await writeFile(destPath, content);
            }
        }
    }

    private async transformTypeScriptFile(
        srcPath: string,
        destPath: string,
    ): Promise<void> {
        let content = await readFile(srcPath, "utf-8");

        // Transform .ts imports to .js imports
        content = content.replace(
            /(?:import|export)([^;]+from\s+['"`])([^'"`]+)\.ts(['"`][^;]*;?)/g,
            "$1$2.js$3",
        );

        // Also handle dynamic imports
        content = content.replace(
            /import\s*\(\s*['"`]([^'"`]+)\.ts['"`]\s*\)/g,
            'import("$1.js")',
        );

        await writeFile(destPath, content);
    }

    private async runTypeScriptCompiler(): Promise<void> {
        console.log("Running TypeScript compiler...");

        const { spawn } = await import("node:child_process");

        return new Promise((resolve, reject) => {
            // Create a temporary tsconfig for the build
            const tsconfigContent = {
                extends: "./tsconfig.json",
                compilerOptions: {
                    rootDir: this.options.tempDir,
                    outDir: this.options.outDir,
                    allowImportingTsExtensions: false,
                    noEmit: false,
                },
                include: [`${this.options.tempDir}/**/*`],
            };

            writeFile(
                "./tsconfig.build.json",
                JSON.stringify(tsconfigContent, null, 2),
            )
                .then(() => {
                    const tsc = spawn(
                        "npx",
                        ["tsc", "--project", "tsconfig.build.json"],
                        {
                            stdio: "inherit",
                            shell: true,
                        },
                    );

                    tsc.on("close", (code) => {
                        if (code === 0) {
                            resolve();
                        } else {
                            reject(
                                new Error(
                                    `TypeScript compiler failed with code ${code}`,
                                ),
                            );
                        }
                    });
                })
                .catch(reject);
        });
    }

    private async cleanup(): Promise<void> {
        console.log("Cleaning up...");

        const { rm } = await import("node:fs/promises");

        try {
            await rm(this.options.tempDir, { recursive: true, force: true });
            await rm("./tsconfig.build.json", { force: true });
        } catch (error) {
            console.warn("Warning: Could not clean up temporary files:", error);
        }
    }
}

// Build configuration
const buildOptions: BuildOptions = {
    srcDir: "./src",
    outDir: "./dist",
    tempDir: "./temp-build",
};

// Run the build
async function main() {
    try {
        const builder = new BrewBuilder(buildOptions);
        await builder.build();
    } catch (error) {
        console.error("❌ Build failed:", error);
        process.exit(1);
    }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
