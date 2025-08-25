// deno-lint-ignore-file
import Parser from "./frontend/parser.ts";
import { Evaluate } from "./runtime/interpreter.ts";
import { CreateGlobalEnv } from "./runtime/environment.ts";
import { JavaCompiler } from "./compilation/compiler.ts";
import { compat } from "./compat.ts";

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
 * Cross-platform REPL that works universally
 */
async function Repl() {
    const parser = new Parser();
    const env = CreateGlobalEnv();

    console.log("\nBrew Repl 2.3.0");
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
