// deno-lint-ignore-file no-unused-vars
import Parser from "./frontend/parser.ts";
import { Evaluate } from "./runtime/interpreter.ts";
import { CreateGlobalEnv } from "./runtime/environment.ts";

// Choose what to run - REPL for dev stuff, Run() for script files
// Repl();
Run("./test.txt");

/**
 * Runs whatever code is inside the given file
 * @param filename path to the file you wanna run
 */
async function Run(filename: string) {
    const parser = new Parser();
    const env = CreateGlobalEnv();

    try {
        const input = await Deno.readTextFile(filename);
        const program = parser.ProduceAST(input);
        const result = Evaluate(program, env);
        console.log(result);
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

    console.log("\nPaperBag Repl v0.1");

    while (true) {
        try {
            const input = prompt("> ");

            if (!input) {
                continue;
            } else if (input.includes("exit")) {
                Deno.exit(1);
            }

            const program = parser.ProduceAST(input);
            const result = Evaluate(program, env);
            console.log(result);
        } catch (error) {
            if (error instanceof Error) {
                console.error(`${error.name}: ${error.message}`);
            } else {
                console.error("Unknown error:", error);
            }
        }
    }
}
