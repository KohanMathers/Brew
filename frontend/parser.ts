import {
    Stmt,
    Program,
    Expression,
    BinaryExpression,
    NumericLiteral,
    Identifier,
    VariableDeclaration,
    AssignmentExpression,
    Property,
    ObjectLiteral,
    CallExpression,
    MemberExpression,
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

    private expect(type: TokenType, error?: string) {
        const prev = this.tokens.shift() as Token;
        if (!prev || prev.type !== type) {
            if (error) {
                throw new ParseError(error);
            } else {
                throw new ParseError(
                    `Unexpected token found while parsing. Expected: ${TokenType[type]}, found: { type: ${TokenType[prev.type]}, value: ${prev.value} }`,
                );
            }
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
            case TokenType.Const:
                return this.parse_variable_declaration();
            default:
                return this.parse_expression();
        }
    }

    private parse_variable_declaration(): Stmt {
        const isConstant = this.next().type == TokenType.Const;
        const identifier = this.expect(
            TokenType.Identifier,
            "Expected variable name after declaration keyword.",
        ).value;

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

        this.expect(
            TokenType.Equals,
            `Expected '=' after variable name '${identifier}'.`,
        );
        const declaration = {
            kind: "VariableDeclaration",
            value: this.parse_expression(),
            identifier,
            constant: isConstant,
        } as VariableDeclaration;

        this.expect(
            TokenType.Semicolon,
            "Expected ';' after variable declaration.",
        );
        return declaration;
    }

    private parse_expression(): Expression {
        return this.parse_assignment_Expression();
    }

    private parse_assignment_Expression(): Expression {
        const left = this.parse_object_expression();

        if (this.at().type == TokenType.Equals) {
            this.next();
            const value = this.parse_assignment_Expression();
            return {
                value,
                assignee: left,
                kind: "AssignmentExpression",
            } as AssignmentExpression;
        }
        return left;
    }

    private parse_object_expression(): Expression {
        if (this.at().type != TokenType.OpenBrace)
            return this.parse_additive_expression();

        this.next();
        const properties = new Array<Property>();

        while (this.not_eof() && this.at().type != TokenType.CloseBrace) {
            const key = this.expect(
                TokenType.Identifier,
                "Expected identifier as key in object literal.",
            ).value;

            if (this.at().type == TokenType.Comma) {
                this.next();
                properties.push({
                    key,
                    kind: "Property",
                    value: undefined,
                } as Property);
                continue;
            } else if (this.at().type == TokenType.CloseBrace) {
                properties.push({ key, kind: "Property", value: undefined });
                continue;
            }

            this.expect(
                TokenType.Colon,
                "Expected ':' after key in object literal.",
            );
            const value = this.parse_expression();

            properties.push({ kind: "Property", value, key });
            if (this.at().type != TokenType.CloseBrace) {
                this.expect(
                    TokenType.Comma,
                    "Expected comma or closing brace following property.",
                );
            }
        }

        this.expect(
            TokenType.CloseBrace,
            `Expected '}' to close object literal, found '${this.at().value}'.`,
        );
        return { kind: "ObjectLiteral", properties } as ObjectLiteral;
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
        let left = this.parse_call_member_expression();

        while (
            this.at().value == "*" ||
            this.at().value == "/" ||
            this.at().value == "%"
        ) {
            const operator = this.next().value;
            const right = this.parse_call_member_expression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
            } as BinaryExpression;
        }
        return left;
    }

    private parse_call_member_expression(): Expression {
        const member = this.parse_member_expression();

        if (this.at().type == TokenType.OpenParen) {
            return this.parse_call_expression(member);
        }

        return member;
    }

    private parse_call_expression(caller: Expression): Expression {
        let call_expression: Expression = {
            kind: "CallExpression",
            caller,
            args: this.parse_args(),
        } as CallExpression;

        if (this.at().type == TokenType.OpenParen) {
            call_expression = this.parse_call_expression(call_expression);
        }

        return call_expression;
    }

    private parse_args(): Expression[] {
        this.expect(TokenType.OpenParen);
        const args =
            this.at().type == TokenType.CloseParen
                ? []
                : this.parse_arguments_list();

        this.expect(
            TokenType.CloseParen,
            "Missing closing parenthesis inside arguments list.",
        );
        return args;
    }

    private parse_arguments_list(): Expression[] {
        const args = [this.parse_assignment_Expression()];

        while (this.at().type == TokenType.Comma && this.next()) {
            args.push(this.parse_assignment_Expression());
        }

        return args;
    }

    private parse_member_expression(): Expression {
        let object = this.parse_primary_expression();

        while (
            this.at().type == TokenType.Dot ||
            this.at().type == TokenType.OpenBracket
        ) {
            const operator = this.next();
            let property: Expression;
            let computed: boolean;

            if (operator.type == TokenType.Dot) {
                computed = false;
                property = this.parse_primary_expression();

                if (property.kind != "Identifier") {
                    throw new ParseError(
                        "Cannot use dot operator without identifier.",
                    );
                }
            } else {
                computed = true;
                property = this.parse_expression();
                this.expect(
                    TokenType.CloseBracket,
                    "Missing closing bracket in computed value.",
                );
            }

            object = {
                kind: "MemberExpression",
                object,
                property,
                computed,
            } as MemberExpression;
        }

        return object;
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
                this.expect(
                    TokenType.CloseParen,
                    "Expected closing ')' after expression.",
                );
                return value;
            }

            default:
                throw new ParseError(
                    `Unexpected token found while parsing: { type: ${TokenType[this.at().type]}, value: ${this.at().value} }`,
                );
        }
    }
}
