import Parser  from "./frontend/parser.ts";
import { Evaluate } from "./runtime/interpreter.ts";
repl();

function repl () {
    const parser = new Parser
    console.log("\nPaperBag Repl v0.1")
    while (true) {
        try {
            const input = prompt("> ");

            if (!input || input.includes("exit")) {
                Deno.exit(1);
            }

            const program = parser.ProduceAST(input);

            const result = Evaluate(program);
            console.log(result.value)
        } catch (error) {
            console.error(`${error.name}: ${error.message}`);
        }
    } 
}