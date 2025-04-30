function repl() {
    const parser = new Parser();
    console.log("\nPaperBag Repl v0.1");

    while (true) {
        const input = prompt("> ");

        if (!input || input.includes("exit")) {
            Deno.exit(1);
        }

        try {
            const program = parser.ProduceAST(input);
            console.log(program);
        } catch (error) {
            if (error instanceof ParseError) {
                console.error("Error: " + error.message);
            } else {
                throw error;
            }
        }
    }
}
