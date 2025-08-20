import { readFile, writeFile, readdir, stat, mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));

class BrewBuilder {
    constructor(options) {
        this.options = options;
    }

    async build() {
        console.log("Starting Brew build process...");

        try {
            await this.ensureDirectories();
            await this.copyAndTransformSources();
            await this.runTypeScriptCompiler();
            await this.cleanup();

            console.log("Build complete!");
        } catch (error) {
            console.error("Build failed:", error);
            process.exit(1);
        }
    }

    async ensureDirectories() {
        try {
            await mkdir(this.options.tempDir, { recursive: true });
            await mkdir(this.options.outDir, { recursive: true });
        } catch (_error) {
            // Directories might already exist, that's okay
        }
    }

    async copyAndTransformSources() {
        console.log("Transforming source files...");
        await this.processDirectory(this.options.srcDir, this.options.tempDir);
    }

    async processDirectory(srcDir, destDir) {
        const entries = await readdir(srcDir);

        for (const entry of entries) {
            const srcPath = join(srcDir, entry);
            const destPath = join(destDir, entry);
            const stats = await stat(srcPath);

            if (stats.isDirectory()) {
                await mkdir(destPath, { recursive: true });
                await this.processDirectory(srcPath, destPath);
            } else if (entry.endsWith('.ts')) {
                await this.transformTypeScriptFile(srcPath, destPath);
            } else {
                // Copy non-TypeScript files as-is
                const content = await readFile(srcPath);
                await writeFile(destPath, content);
            }
        }
    }

    async transformTypeScriptFile(srcPath, destPath) {
        let content = await readFile(srcPath, 'utf-8');
        
        // Transform .ts imports to .js imports
        // Match import statements that end with .ts
        content = content.replace(
            /from\s+['"`]([^'"`]+)\.ts['"`]/g,
            'from "$1.js"'
        );

        // Handle export statements with .ts extensions
        content = content.replace(
            /export\s+.*?\s+from\s+['"`]([^'"`]+)\.ts['"`]/g,
            (match) => match.replace(/\.ts(['"`])/, '.js$1')
        );

        // Handle dynamic imports
        content = content.replace(
            /import\s*\(\s*['"`]([^'"`]+)\.ts['"`]\s*\)/g,
            'import("$1.js")'
        );

        // Handle require() statements (in case any exist)
        content = content.replace(
            /require\s*\(\s*['"`]([^'"`]+)\.ts['"`]\s*\)/g,
            'require("$1.js")'
        );

        await writeFile(destPath, content);
    }

    async runTypeScriptCompiler() {
        console.log("Running TypeScript compiler...");
        
        // Create a temporary tsconfig for the build
        const tsconfigContent = {
            "extends": "./tsconfig.json",
            "compilerOptions": {
                "rootDir": this.options.tempDir,
                "outDir": this.options.outDir,
                "allowImportingTsExtensions": false,
                "noEmit": false
            },
            "include": [`${this.options.tempDir}/**/*`]
        };

        await writeFile('./tsconfig.build.json', JSON.stringify(tsconfigContent, null, 2));
        
        // Utility function to promisify spawn
        const runCommand = (command, args, options) => {
            return new Promise((resolve, reject) => {
                const child = spawn(command, args, options);
                
                child.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`TypeScript compiler failed with code ${code}`));
                    }
                });
                
                child.on('error', reject);
            });
        };

        await runCommand('npx', ['tsc', '--project', 'tsconfig.build.json'], {
            stdio: 'inherit',
            shell: true
        });
    }

    async cleanup() {
        console.log("Cleaning up...");
        
        try {
            await rm(this.options.tempDir, { recursive: true, force: true });
            await rm('./tsconfig.build.json', { force: true });
        } catch (error) {
            console.warn("Warning: Could not clean up temporary files:", error);
        }
    }
}

// Build configuration
const buildOptions = {
    srcDir: './src',
    outDir: './dist',
    tempDir: './temp-build'
};

// Run the build
async function main() {
    const builder = new BrewBuilder(buildOptions);
    await builder.build();
}

main();