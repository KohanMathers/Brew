import {
    Stmt,
    Program,
    Expression,
    BinaryExpression,
    NumericLiteral,
    Identifier,
    VariableDeclaration,
} from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";
import { ParseError } from "./errors.ts";

export default class Parser {
    private tokens: Token[] = [];

    private not_eof(): boolean {
        return this.tokens[0].type != TokenType.EOF;
    }

    private at() {
        return this.tokens[0] as Token;
    }

    private next() {
        const prev = this.tokens.shift() as Token;
        return prev;
    }

    private expect(type: TokenType) {
        const prev = this.tokens.shift() as Token;
        if (!prev || prev.type !== type) {
            throw new ParseError(
                `Unexpected token found while parsing. Expected: ${TokenType[type]}, found: { type: ${TokenType[prev.type]}, value: ${prev.value} }`,
            );
        }

        return prev;
    }

    public ProduceAST(sourceCode: string): Program {
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

    private parse_stmt(): Stmt {
        switch (this.at().type) {
            case TokenType.Let:
                return this.parse_variable_declaration();
            case TokenType.Const:
                return this.parse_variable_declaration();
            default:
                return this.parse_expression();
        }
    }

    private parse_variable_declaration(): Stmt {
        const isConstant = this.next().type == TokenType.Const;
        const identifier = this.expect(TokenType.Identifier).value;

        if (this.at().type == TokenType.Semicolon) {
            this.next();
            if (isConstant) {
                throw new ParseError(
                    `Must assign value to consant expression ${identifier}. No value provided.`,
                );
            }

            return {
                kind: "VariableDeclaration",
                identifier,
                constant: false,
            } as VariableDeclaration;
        }

        this.expect(TokenType.Equals);
        const declaration = {
            kind: "VariableDeclaration",
            value: this.parse_expression(),
            constant: isConstant,
        } as VariableDeclaration;

        this.expect(TokenType.Semicolon);
        return declaration;
    }

    private parse_expression(): Expression {
        return this.parse_additive_expression();
    }

    private parse_additive_expression(): Expression {
        let left = this.parse_multiplicative_expression();

        while (this.at().value == "+" || this.at().value == "-") {
            const operator = this.next().value;
            const right = this.parse_multiplicative_expression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
            } as BinaryExpression;
        }
        return left;
    }

    private parse_multiplicative_expression(): Expression {
        let left = this.parse_primary_expression();

        while (
            this.at().value == "*" ||
            this.at().value == "/" ||
            this.at().value == "%"
        ) {
            const operator = this.next().value;
            const right = this.parse_primary_expression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
            } as BinaryExpression;
        }
        return left;
    }

    private parse_primary_expression(): Expression {
        const token = this.at().type;

        switch (token) {
            case TokenType.Identifier:
                return {
                    kind: "Identifier",
                    symbol: this.next().value,
                } as Identifier;
            case TokenType.Number:
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(this.next().value),
                } as NumericLiteral;
            case TokenType.OpenParen: {
                this.next();
                const value = this.parse_expression();
                this.expect(TokenType.CloseParen);
                return value;
            }

            default:
                throw new ParseError(
                    `Unexpected token found while parsing: { type: ${TokenType[this.at().type]}, value: ${this.at().value} }`,
                );
        }
    }
}
