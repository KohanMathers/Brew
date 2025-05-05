import {
    Stmt,
    Program,
    Expression,
    BinaryExpression,
    NumericLiteral,
    Identifier,
    VariableDeclaration,
    FunctionDeclaration,
    AssignmentExpression,
    Property,
    ObjectLiteral,
    CallExpression,
    MemberExpression,
} from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";
import { FunctionError, ParseError } from "./errors.ts";

/**
 * Parser class for turning tokens into an Abstract Syntax Tree
 */
export default class Parser {
    private tokens: Token[] = [];

    /**
     * Turns source code into an AST
     * @param sourceCode The source code to parse
     * @returns A Program node representing the AST
     */
    public ProduceAST(sourceCode: string): Program {
        this.tokens = tokenize(sourceCode);

        const program: Program = {
            kind: "Program",
            body: [],
        };

        while (this.NotEOF()) {
            program.body.push(this.ParseStatement());
        }

        return program;
    }

    // ===== Token Management Methods =====

    /**
     * Checks if there are still tokens left to process
     */
    private NotEOF(): boolean {
        return this.tokens[0].type != TokenType.EOF;
    }

    /**
     * Returns the current token without consuming it
     */
    private At(): Token {
        return this.tokens[0] as Token;
    }

    /**
     * Consumes and returns the current token
     */
    private Next(): Token {
        const prev = this.tokens.shift() as Token;
        return prev;
    }

    /**
     * Expects a specific token type and throws an error if not matched
     */
    private Expect(type: TokenType, error?: string): Token {
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

    // ===== Statement Parsing Methods =====

    /**
     * Parses a statement
     */
    private ParseStatement(): Stmt {
        switch (this.At().type) {
            case TokenType.Let:
            case TokenType.Const:
                return this.ParseVariableDeclaration();
            case TokenType.Function:
                return this.ParseFunctionDeclaration();
            default:
                return this.ParseExpression();
        }
    }

    /**
     * Parses a variable declaration
     */
    private ParseVariableDeclaration(): Stmt {
        const isConstant = this.Next().type == TokenType.Const;
        const identifier = this.Expect(
            TokenType.Identifier,
            "Expected variable name after declaration keyword.",
        ).value;

        if (this.At().type == TokenType.Semicolon) {
            this.Next();
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

        this.Expect(
            TokenType.Equals,
            `Expected '=' after variable name '${identifier}'.`,
        );
        const declaration = {
            kind: "VariableDeclaration",
            value: this.ParseExpression(),
            identifier,
            constant: isConstant,
        } as VariableDeclaration;

        this.Expect(
            TokenType.Semicolon,
            "Expected ';' after variable declaration.",
        );
        return declaration;
    }

    /**
     * Parses a function declaration
     */
    private ParseFunctionDeclaration(): Stmt {
        this.Next();
        const name = this.Expect(
            TokenType.Identifier,
            "Expected function name following keyword.",
        ).value;
        const args = this.ParseArgs();
        const parameters: string[] = [];
        for (const arg of args) {
            if (arg.kind != "Identifier") {
                throw new FunctionError(
                    "Expected parameters inside function declaration to be of type string",
                );
            }

            parameters.push((arg as Identifier).symbol);
        }

        this.Expect(
            TokenType.OpenBrace,
            "Expected function body following declaration.",
        );

        const body: Stmt[] = [];

        while (this.NotEOF() && this.At().type != TokenType.CloseBrace) {
            body.push(this.ParseStatement());
        }

        this.Expect(TokenType.CloseBrace);
        const func = {
            body,
            name,
            parameters,
            kind: "FunctionDeclaration",
        } as FunctionDeclaration;

        return func;
    }

    // ===== Expression Parsing Methods =====

    /**
     * Entry point for parsing expressions
     */
    private ParseExpression(): Expression {
        return this.ParseAssignmentExpression();
    }

    /**
     * Parses assignment expressions
     */
    private ParseAssignmentExpression(): Expression {
        const left = this.ParseObjectExpression();

        if (this.At().type == TokenType.Equals) {
            this.Next();
            const value = this.ParseAssignmentExpression();
            return {
                value,
                assignee: left,
                kind: "AssignmentExpression",
            } as AssignmentExpression;
        }
        return left;
    }

    /**
     * Parses object literals
     */
    private ParseObjectExpression(): Expression {
        if (this.At().type != TokenType.OpenBrace)
            return this.ParseAdditiveExpression();

        this.Next();
        const properties = new Array<Property>();

        while (this.NotEOF() && this.At().type != TokenType.CloseBrace) {
            const key = this.Expect(
                TokenType.Identifier,
                "Expected identifier as key in object literal.",
            ).value;

            if (this.At().type == TokenType.Comma) {
                this.Next();
                properties.push({
                    key,
                    kind: "Property",
                    value: undefined,
                } as Property);
                continue;
            } else if (this.At().type == TokenType.CloseBrace) {
                properties.push({ key, kind: "Property", value: undefined });
                continue;
            }

            this.Expect(
                TokenType.Colon,
                "Expected ':' after key in object literal.",
            );
            const value = this.ParseExpression();

            properties.push({ kind: "Property", value, key });
            if (this.At().type != TokenType.CloseBrace) {
                this.Expect(
                    TokenType.Comma,
                    "Expected comma or closing brace following property.",
                );
            }
        }

        this.Expect(
            TokenType.CloseBrace,
            `Expected '}' to close object literal, found '${this.At().value}'.`,
        );
        return { kind: "ObjectLiteral", properties } as ObjectLiteral;
    }

    /**
     * Parses additive expressions (+, -)
     */
    private ParseAdditiveExpression(): Expression {
        let left = this.ParseMultiplicativeExpression();

        while (this.At().value == "+" || this.At().value == "-") {
            const operator = this.Next().value;
            const right = this.ParseMultiplicativeExpression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
            } as BinaryExpression;
        }
        return left;
    }

    /**
     * Parses multiplicative expressions (*, /, %)
     */
    private ParseMultiplicativeExpression(): Expression {
        let left = this.ParseCallMemberExpression();

        while (
            this.At().value == "*" ||
            this.At().value == "/" ||
            this.At().value == "%"
        ) {
            const operator = this.Next().value;
            const right = this.ParseCallMemberExpression();
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator,
            } as BinaryExpression;
        }
        return left;
    }

    /**
     * Parses function call and member expressions
     */
    private ParseCallMemberExpression(): Expression {
        const member = this.ParseMemberExpression();

        if (this.At().type == TokenType.OpenParen) {
            return this.ParseCallExpression(member);
        }

        return member;
    }

    /**
     * Parses function call expressions
     */
    private ParseCallExpression(caller: Expression): Expression {
        let callExpression: Expression = {
            kind: "CallExpression",
            caller,
            args: this.ParseArgs(),
        } as CallExpression;

        if (this.At().type == TokenType.OpenParen) {
            callExpression = this.ParseCallExpression(callExpression);
        }

        return callExpression;
    }

    /**
     * Parses function arguments
     */
    private ParseArgs(): Expression[] {
        this.Expect(TokenType.OpenParen);
        const args =
            this.At().type == TokenType.CloseParen
                ? []
                : this.ParseArgumentsList();

        this.Expect(
            TokenType.CloseParen,
            "Missing closing parenthesis inside arguments list.",
        );
        return args;
    }

    /**
     * Parses a list of function arguments
     */
    private ParseArgumentsList(): Expression[] {
        const args = [this.ParseAssignmentExpression()];

        while (this.At().type == TokenType.Comma && this.Next()) {
            args.push(this.ParseAssignmentExpression());
        }

        return args;
    }

    /**
     * Parses member expressions (obj.prop or obj[prop])
     */
    private ParseMemberExpression(): Expression {
        let object = this.ParsePrimaryExpression();

        while (
            this.At().type == TokenType.Dot ||
            this.At().type == TokenType.OpenBracket
        ) {
            const operator = this.Next();
            let property: Expression;
            let computed: boolean;

            if (operator.type == TokenType.Dot) {
                computed = false;
                property = this.ParsePrimaryExpression();

                if (property.kind != "Identifier") {
                    throw new ParseError(
                        "Cannot use dot operator without identifier.",
                    );
                }
            } else {
                computed = true;
                property = this.ParseExpression();
                this.Expect(
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

    /**
     * Parses primary expressions (identifiers, literals, grouped expressions)
     */
    private ParsePrimaryExpression(): Expression {
        const token = this.At().type;

        switch (token) {
            case TokenType.Identifier:
                return {
                    kind: "Identifier",
                    symbol: this.Next().value,
                } as Identifier;

            case TokenType.Number:
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(this.Next().value),
                } as NumericLiteral;

            case TokenType.OpenParen: {
                this.Next();
                const value = this.ParseExpression();
                this.Expect(
                    TokenType.CloseParen,
                    "Expected closing ')' after expression.",
                );
                return value;
            }

            default:
                throw new ParseError(
                    `Unexpected token found while parsing: { type: ${TokenType[this.At().type]}, value: ${this.At().value} }`,
                );
        }
    }
}
