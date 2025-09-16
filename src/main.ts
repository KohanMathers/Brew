// deno-lint-ignore-file
import Parser from "./frontend/parser.ts";
import { Evaluate } from "./runtime/interpreter.ts";
import { CreateGlobalEnv } from "./runtime/environment.ts";
import { JavaCompiler } from "./compilation/compiler.ts";
import { compat } from "./compat.ts";
import { InstallError } from "./frontend/errors.ts";

// Global BrewEngine object for library usage
const BrewEngine = {
    compile: async function (
        code: string,
        className: string = "Program",
    ): Promise<string> {
        try {
            const parser = new Parser();
            const compiler = new JavaCompiler();
            const program = parser.ProduceAST(code);
            return compiler.compile(program, className);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`${error.name}: ${error.message}`);
            } else {
                throw new Error("Unknown compilation error: " + error);
            }
        }
    },

    interpret: function (code: string): string {
        try {
            const parser = new Parser();
            const env = CreateGlobalEnv();
            const program = parser.ProduceAST(code);

            // Capture console output
            const originalLog = console.log;
            let output = "";
            console.log = (...args: any[]) => {
                output += args.join(" ") + "\n";
            };

            const result = Evaluate(program, env);

            // Restore console.log
            console.log = originalLog;

            return output || String(result);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`${error.name}: ${error.message}`);
            } else {
                throw new Error("Unknown interpretation error: " + error);
            }
        }
    },

    repl: async function (): Promise<void> {
        await Repl();
    },

    run: async function (filename: string): Promise<void> {
        await Run(filename);
    },

    compileFile: async function (
        filename: string,
        className?: string,
    ): Promise<void> {
        await Compile(filename, className);
    },
};

// Export for library usage
if (typeof globalThis !== "undefined") {
    (globalThis as any).BrewEngine = BrewEngine;
}

// Only run CLI logic if we're being executed directly
const args = compat.args;

// Check if we're in a JVM environment - if so, don't run CLI logic
const isJVM = typeof Java !== "undefined";
const hasArgs = args && args.length > 0;

if (!isJVM && (hasArgs || typeof Deno !== "undefined")) {
    if (args.length > 0) {
        if (args[0] === "run") {
            Run(args[1]);
        } else if (args[0] === "compile") {
            Compile(args[1], args[2]);
        } else if (args[0] === "install") {
            Install(args[1], args[2]);
        } else {
            console.error("Unknown command: " + args[0]);
            compat.exit(1);
        }
    } else {
        Repl();
    }
}

/**
 * Runs whatever code is inside the given file
 * @param filename path to the file you wanna run
 */
async function Run(filename: string) {
    const parser = new Parser();
    const env = CreateGlobalEnv();

    if (!filename.endsWith(".brew")) {
        console.error("Only .brew files are supported.");
        compat.exit(1);
    }

    try {
        const input = await compat.readTextFile(filename);
        const program = parser.ProduceAST(input);
        Evaluate(program, env);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`${error.name}: ${error.message}`);
        } else {
            console.error("Unknown error:", error);
        }
    }
}

/**
 * Version 2.0: Compiles the given file to Java
 * @param filename path to the file you wanna compile
 * @param className optional class name
 */
async function Compile(filename: string, className?: string) {
    if (!filename.endsWith(".brew")) {
        console.error("Only .brew files are supported.");
        compat.exit(1);
    }

    try {
        const parser = new Parser();
        const compiler = new JavaCompiler();

        const brewCode = await compat.readTextFile(filename);
        const program = parser.ProduceAST(brewCode);
        const finalClassName = className || "Program";
        const javaCode = compiler.compile(program, finalClassName);

        const outputFilename = finalClassName + ".java";
        await compat.mkdir("./compiled");
        await compat.writeTextFile("./compiled/" + outputFilename, javaCode);
        console.log(`\nJava code written to: ./compiled/${outputFilename}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`${error.name}: ${error.message}`);
        } else {
            console.error("Unknown error:", error);
        }
    }
}

/**
 * Installs a package in the current environment
 * @param githubRepo The repository to download the package from, in format author.repo
 * @param packageName The package to download
 * @example install kohanmathers.brew-packages time
 * Note to package developers: Lay out the entry point to your package as brew_packages/<packageName>/main.brew, as everything in brew_packages/<packageName> will be downloaded.
 */
async function Install(githubRepo: string, packageName: string) {
    const splitRepo = githubRepo.split(".");
    const repoAuthor = splitRepo[0];
    const repoName = splitRepo[1];
    
    console.log(`Installing package '${packageName}' from ${repoAuthor}/${repoName}...`);
    
    try {
        await downloadPackageContents(repoAuthor, repoName, packageName);
        console.log(`Successfully installed package '${packageName}'`);
        
    } catch (error) {
        console.error(`Installation failed: ${error}`);
        throw error;
    }
}

/**
 * Downloads the package contents using GitHub Contents API
 */
async function downloadPackageContents(repoAuthor: string, repoName: string, packageName: string) {
    const packagePath = `brew_packages/${packageName}`;
    const apiUrl = `https://api.github.com/repos/${repoAuthor}/${repoName}/contents/${packagePath}`;
    
    console.log(`Fetching package contents from: ${packagePath}`);
    
    const response = await fetch(apiUrl, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'brew-package-installer'
        }
    });
    
    if (response.status === 404) {
        throw new Error(`Package '${packageName}' not found in repository. Expected path: ${packagePath}`);
    }
    
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const contents = await response.json();
    
    if (!Array.isArray(contents)) {
        throw new Error(`Expected directory at ${packagePath}, but found a file`);
    }
    
    await createInstallDirectory(packageName);
    
    await downloadContentsRecursive(contents, packageName, '');
    
    await verifyEntryPoint(packageName);
}

/**
 * Recursively downloads all contents from a directory
 */
async function downloadContentsRecursive(contents: any[], packageName: string, relativePath: string) {
    for (const item of contents) {
        const itemPath = relativePath ? `${relativePath}/${item.name}` : item.name;
        
        if (item.type === 'file') {
            console.log(`Downloading: ${itemPath}`);
            await downloadFile(item.download_url, packageName, itemPath);
            
        } else if (item.type === 'dir') {
            console.log(`Creating directory: ${itemPath}`);
            await createDirectory(packageName, itemPath);
            
            const subDirResponse = await fetch(item.url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'brew-package-installer'
                }
            });
            
            if (subDirResponse.ok) {
                const subContents = await subDirResponse.json();
                await downloadContentsRecursive(subContents, packageName, itemPath);
            } else {
                console.warn(`Failed to fetch subdirectory: ${itemPath}`);
            }
        }
    }
}

/**
 * Downloads a single file
 */
async function downloadFile(downloadUrl: string, packageName: string, filePath: string) {
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
        throw new Error(`Failed to download file: ${filePath}`);
    }
    
    const content = await response.text();
    await saveFile(packageName, filePath, content);
}

async function createInstallDirectory(packageName: string) {
    const installDir = `brew_packages/${packageName}`;
    await compat.mkdir(installDir);
    return installDir;
}

async function createDirectory(packageName: string, dirPath: string) {
    const fullPath = `brew_packages/${packageName}/${dirPath}`;
    await compat.mkdir(fullPath);
}

async function saveFile(packageName: string, filePath: string, content: string) {
    const fullPath = `brew_packages/${packageName}/${filePath}`;
    await compat.writeTextFile(fullPath, content);
}

async function verifyEntryPoint(packageName: string) {
    const mainBrewPath = `brew_packages/${packageName}/main.brew`;
    
    try {
        if (compat.existsSync(mainBrewPath)) {
            console.log(`✓ Found entry point: main.brew`);
        } else {
            console.warn(`⚠ Warning: main.brew not found in package '${packageName}'`);
        }
    } catch {
        console.warn(`⚠ Warning: Could not verify main.brew in package '${packageName}'`);
    }
}

async function createInstallDirectoryBrowser(packageName: string) {
    return {};
}

async function saveFileBrowser(packageName: string, filePath: string, content: string, storage: any) {
    storage[filePath] = content;
    return storage;
}

/**
 * Browser-compatible version that returns files as an object
 */
async function downloadPackageContentsBrowser(repoAuthor: string, repoName: string, packageName: string) {
    const packagePath = `brew_packages/${packageName}`;
    const apiUrl = `https://api.github.com/repos/${repoAuthor}/${repoName}/contents/${packagePath}`;
    
    const response = await fetch(apiUrl, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'brew-package-installer'
        }
    });
    
    if (response.status === 404) {
        throw new Error(`Package '${packageName}' not found in repository. Expected path: ${packagePath}`);
    }
    
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const contents = await response.json();
    const files: { [path: string]: string } = {};
    
    await downloadContentsRecursiveBrowser(contents, files, '');
    
    if (!files['main.brew']) {
        console.warn(`⚠ Warning: main.brew not found in package '${packageName}'`);
    } else {
        console.log(`✓ Found entry point: main.brew`);
    }
    
    return files;
}

async function downloadContentsRecursiveBrowser(contents: any[], files: any, relativePath: string) {
    for (const item of contents) {
        const itemPath = relativePath ? `${relativePath}/${item.name}` : item.name;
        
        if (item.type === 'file') {
            console.log(`Downloading: ${itemPath}`);
            const response = await fetch(item.download_url);
            const content = await response.text();
            files[itemPath] = content;
            
        } else if (item.type === 'dir') {
            console.log(`Processing directory: ${itemPath}`);
            
            const subDirResponse = await fetch(item.url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'brew-package-installer'
                }
            });
            
            if (subDirResponse.ok) {
                const subContents = await subDirResponse.json();
                await downloadContentsRecursiveBrowser(subContents, files, itemPath);
            }
        }
    }
}

/**
 * Cross-platform REPL that works universally
 */
async function Repl() {
    const parser = new Parser();
    const env = CreateGlobalEnv();

    console.log("\nBrew Repl 2.5.0");
    console.log("Type 'exit' to quit");

    let readLine: () => Promise<string | null>;

    if (typeof Deno !== "undefined") {
        // Deno / Browser
        readLine = async () => prompt("> ");
    } else if (typeof Java !== "undefined") {
        // JVM - Make this non-blocking by returning immediately
        console.log("REPL not supported in JVM library mode");
        return;
    } else {
        throw new Error("No REPL supported in this environment");
    }

    await universalRepl(parser, env, readLine);
    compat.exit(0);
}

/**
 * Universal REPL handler
 */
async function universalRepl(
    parser: Parser,
    env: any,
    readLine: () => Promise<string | null>,
) {
    while (true) {
        const input = await readLine();

        if (input === null || input.trim() === "exit") {
            console.log("Goodbye!");
            break;
        }

        if (!input.trim()) continue;

        try {
            const program = parser.ProduceAST(input);
            Evaluate(program, env);
        } catch (error) {
            if (error instanceof Error)
                console.error(`${error.name}: ${error.message}`);
            else console.error("Unknown error:", error);
        }
    }
}
