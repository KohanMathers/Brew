import Parser from "./frontend/parser.ts";
import { Evaluate } from "./runtime/interpreter.ts";
import { CreateGlobalEnv } from "./runtime/environment.ts";
import { JavaCompiler } from "./compilation/compiler.ts";

const args = Deno.args;

if (args.length > 0) {
    if (args[0] === "run") {
        Run(args[1]);
    } else if (args[0] === "compile") {
        Compile(args[1]);
    } else {
        console.error("Unknown command: " + args[0]);
        Deno.exit(1);
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

    if (!filename.endsWith(".pbag")) {
        console.error("Only .pbag files are supported.");
        Deno.exit(1);
    }

    try {
        const input = await Deno.readTextFile(filename);
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
    if (!filename.endsWith(".pbag")) {
        console.error("Only .pbag files are supported.");
        Deno.exit(1);
    }

    try {
        const parser = new Parser();
        const compiler = new JavaCompiler();

        const paperBagCode = await Deno.readTextFile(filename);

        const program = parser.ProduceAST(paperBagCode);

        const className = args[2] || "Program";

        const javaCode = compiler.compile(program, className);

        const outputFilename = args[2] + ".java";
        await Deno.writeTextFile("./compiled/" + outputFilename, javaCode);
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
 * REPL mode — for messing around with PaperBag live
 */
function Repl() {
    const parser = new Parser();
    const env = CreateGlobalEnv();

    console.log("\nPaperBag Repl v2.0");

    while (true) {
        try {
            const input = prompt("> ");

            if (!input) {
                continue;
            } else if (input.includes("exit")) {
                Deno.exit(1);
            }

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
}
