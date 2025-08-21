// deno-lint-ignore-file
import Parser from "./frontend/parser.ts";
import { Evaluate } from "./runtime/interpreter.ts";
import { CreateGlobalEnv } from "./runtime/environment.ts";
import { JavaCompiler } from "./compilation/compiler.ts";
import { compat } from "./compat.ts";

const args = compat.args;

if (args.length > 0) {
    if (args[0] === "run") {
        Run(args[1]);
    } else if (args[0] === "compile") {
        Compile(args[1]);
    } else {
        console.error("Unknown command: " + args[0]);
        compat.exit(1);
    }
} else {
    Repl();
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
 */
async function Compile(filename: string) {
    if (!filename.endsWith(".brew")) {
        console.error("Only .brew files are supported.");
        compat.exit(1);
    }

    try {
        const parser = new Parser();
        const compiler = new JavaCompiler();

        const brewCode = await compat.readTextFile(filename);

        const program = parser.ProduceAST(brewCode);

        const className = args[2] || "Program";

        const javaCode = compiler.compile(program, className);

        const outputFilename = (args[2] || "Program") + ".java";
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
 * Detect if we're running in Deno or Node.js
 */
function isDeno(): boolean {
    return typeof Deno !== "undefined";
}

/**
 * Cross-platform REPL that works universally
 */
async function Repl() {
    const parser = new Parser();
    const env = CreateGlobalEnv();

    console.log("\nBrew Repl v2.2.0");
    console.log("Type 'exit' to quit");

    if (typeof Deno !== "undefined") {
        await universalRepl(parser, env, async () => prompt("> "));
    } else if (typeof process !== "undefined" && process.versions?.node) {
        const readline = await import("node:readline");
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        await universalRepl(
            parser,
            env,
            () =>
                new Promise<string | null>((resolve) =>
                    rl.question("> ", (answer) => resolve(answer)),
                ),
        );
        rl.close();
    } else if (typeof Java !== "undefined") {
        // JVM version: use console input via Scanner
        const Scanner = Java.type("java.util.Scanner");
        const scanner = new Scanner(Java.type("java.lang.System").in);
        await universalRepl(parser, env, async () => scanner.nextLine());
    } else {
        throw new Error("No REPL supported in this environment");
    }

    compat.exit(0);
}

/**
 * Universal REPL handler
 * @param parser parser instance
 * @param env environment
 * @param readLine async function returning user input
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
