/**
 * Token interface - represents a basic unit in the source code
 */
export interface Token {
    value: string;
    type: TokenType;
}

/**
 * Enum for all possible token types
 */
export enum TokenType {
    Number,
    Identifier,
    Equals,
    Comma,
    Dot,
    Colon,
    Semicolon,
    OpenParen,
    CloseParen,
    OpenBrace,
    CloseBrace,
    OpenBracket,
    CloseBracket,
    BinaryOperator,
    Let,
    Const,
    EOF,
}

/**
 * Maps keywords to their token types
 */
const KEYWORDS: Record<string, TokenType> = {
    let: TokenType.Let,
    const: TokenType.Const,
};

/**
 * Creates a new token with a given value and type
 */
function CreateToken(value = "", type: TokenType): Token {
    return { value, type };
}

/**
 * Checks if a character is alphabetic (a letter)
 */
function IsAlpha(src: string): boolean {
    return src.toUpperCase() != src.toLowerCase();
}

/**
 * Checks if a character is a digit
 */
function IsInt(src: string): boolean {
    const c = src.charCodeAt(0);
    const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];

    return c >= bounds[0] && c <= bounds[1];
}

/**
 * Checks if a character is any kind of whitespace (space, newline, tab, carriage return)
 */
function IsSkippable(src: string): boolean {
    return src == " " || src == "\n" || src == "\t" || src == "\r";
}

/**
 * Tokenizes source code into an array of tokens
 * @param sourceCode The source code to tokenize
 * @returns An array of tokens
 */
export function tokenize(sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");

    // Process each character in the source code
    while (src.length > 0) {
        // Handle single-character tokens
        if (src[0] == "(") {
            tokens.push(CreateToken(src.shift(), TokenType.OpenParen));
        } else if (src[0] == ")") {
            tokens.push(CreateToken(src.shift(), TokenType.CloseParen));
        } else if (src[0] == "{") {
            tokens.push(CreateToken(src.shift(), TokenType.OpenBrace));
        } else if (src[0] == "}") {
            tokens.push(CreateToken(src.shift(), TokenType.CloseBrace));
        } else if (src[0] == "[") {
            tokens.push(CreateToken(src.shift(), TokenType.OpenBracket));
        } else if (src[0] == "]") {
            tokens.push(CreateToken(src.shift(), TokenType.CloseBracket));
        } else if (
            src[0] == "+" ||
            src[0] == "-" ||
            src[0] == "*" ||
            src[0] == "/" ||
            src[0] == "%"
        ) {
            tokens.push(CreateToken(src.shift(), TokenType.BinaryOperator));
        } else if (src[0] == "=") {
            tokens.push(CreateToken(src.shift(), TokenType.Equals));
        } else if (src[0] == ";") {
            tokens.push(CreateToken(src.shift(), TokenType.Semicolon));
        } else if (src[0] == ":") {
            tokens.push(CreateToken(src.shift(), TokenType.Colon));
        } else if (src[0] == ",") {
            tokens.push(CreateToken(src.shift(), TokenType.Comma));
        } else if (src[0] == ".") {
            tokens.push(CreateToken(src.shift(), TokenType.Dot));
        } else {
            // Handle multi-character tokens (numbers and identifiers)
            if (IsInt(src[0])) {
                let num = "";
                while (src.length > 0 && IsInt(src[0])) {
                    num += src.shift();
                }

                tokens.push(CreateToken(num, TokenType.Number));
            } else if (IsAlpha(src[0])) {
                let ident = "";
                while (src.length > 0 && IsAlpha(src[0])) {
                    ident += src.shift();
                }

                // Check if the identifier is a reserved keyword
                const reserved = KEYWORDS[ident];
                if (typeof reserved == "number") {
                    tokens.push(CreateToken(ident, reserved));
                } else {
                    tokens.push(CreateToken(ident, TokenType.Identifier));
                }
            } else if (IsSkippable(src[0])) {
                // Skip whitespace characters
                src.shift();
            } else {
                // Handle unrecognized characters
                console.log("Unrecognised character in source:", src[0]);
                Deno.exit(1);
            }
        }
    }

    // Add EOF token
    tokens.push({ type: TokenType.EOF, value: "EndOfFile" });
    return tokens;
}
