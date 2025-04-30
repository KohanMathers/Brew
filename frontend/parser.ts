import { Stmt, Program, Expression, NumericLiteral, Identifier } from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";

export default class Parser {
    private tokens: Token[] = [];

    private not_eof (): boolean {
        return this.tokens[0].type != TokenType.EOF;
    }

    private at () {
        return this.tokens[0] as Token;
    }

    private next () {
        const prev = this.tokens.shift() as Token;
        return prev;
    }

    public ProduceAST (sourceCode: string): Program {        
        this.tokens = tokenize(sourceCode);

        const program: Program = {
            kind: "Program",
            body: [],
        };

        while (this.not_eof()) {
            program.body.push(this.parse_stmt());
        }
        
        return program;
    }

    private parse_stmt (): Stmt {
        return this.parse_expression();
    }

    private parse_expression (): Expression {
        return this.parse_primary_expression()
    }

    private parse_primary_expression (): Expression {
        const token = this.at().type;

        switch (token) {
            case TokenType.Identifier:
                return { kind: "Identifier", symbol: this.next().value} as Identifier;
            case TokenType.Number:
                return { kind: "NumericLiteral", value: parseFloat(this.next().value)} as NumericLiteral;

            default:
                console.error("Unexpected token found during parsing:", this.at());
                Deno.exit(1);
        }
    }
}