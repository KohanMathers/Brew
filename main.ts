import Parser from "./frontend/parser.ts";
import { Evaluate } from "./runtime/interpreter.ts";
import { CreateGlobalEnv } from "./runtime/environment.ts";

const args = Deno.args;

if (args.length > 0) {
    Run(args[0]);
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
 * REPL mode — for messing around with PaperBag live
 */
function Repl() {
    const parser = new Parser();
    const env = CreateGlobalEnv();

    console.log("\nPaperBag Repl v1.9");

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
