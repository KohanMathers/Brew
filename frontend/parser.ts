import { Stmt, Program, Expression, BinaryExpression, NumericLiteral, Identifier } from "./ast.ts";
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
        return this.parse_additive_expression()
    }

    private parse_additive_expression (): Expression {
        let left = this.parse_multiplicative_expression();

        while (this.at().value == "+" || this.at().value == "-") {
            const operator = this.next().value;
            const right = this.parse_multiplicative_expression();
            left =  {
                kind: "BinaryExpression",
                left,
                right,
                operator,
            } as BinaryExpression;
        }
        return left;
    }

    private parse_multiplicative_expression (): Expression {
        let left = this.parse_primary_expression();

        while (this.at().value == "*" || this.at().value == "/" || this.at().value == "%") {
            const operator = this.next().value;
            const right = this.parse_primary_expression();
            left =  {
                kind: "BinaryExpression",
                left,
                right,
                operator,
            } as BinaryExpression;
        }
        return left;
    }

    private parse_primary_expression (): Expression {
        const token = this.at().type;

        switch (token) {
            case TokenType.Identifier:
                return { kind: "Identifier", symbol: this.next().value} as Identifier;
            case TokenType.Number:
                return { kind: "NumericLiteral", value: parseFloat(this.next().value)} as NumericLiteral;
            case TokenType.Equals:
                    return { kind: "NumericLiteral", value: parseFloat(this.next().value)} as NumericLiteral;

            default:
                console.error("Unexpected token found during parsing:", this.at());
                Deno.exit(1);
        }
    }
}