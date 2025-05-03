import Parser from "./frontend/parser.ts";
import { Evaluate } from "./runtime/interpreter.ts";
import { createGlobalEnv } from "./runtime/environment.ts";
//repl();
run("./test.txt");

async function run(filename: string) {
    const parser = new Parser();
    const env = createGlobalEnv();
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

function _repl() {
    const parser = new Parser();
    const env = createGlobalEnv();
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
