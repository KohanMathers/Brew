"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // dist/compat.js
  var require_compat = __commonJS({
    "dist/compat.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.compat = void 0;
      var isDeno = typeof Deno !== "undefined";
      var isJava = typeof Java !== "undefined";
      exports.compat = {
        args: isDeno && Deno ? Deno.args : [],
        exit: (code) => {
          if (isDeno && Deno)
            return Deno.exit(code);
          throw new Error(`exit(${code}) called in unsupported environment`);
        },
        readTextFile: async (path) => {
          if (isDeno && Deno)
            return await Deno.readTextFile(path);
          if (isJava && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            const bytes = Files.readAllBytes(Paths.get(path));
            return new Java.type("java.lang.String")(bytes, "UTF-8");
          }
          throw new Error("readTextFile not supported in this environment");
        },
        writeTextFile: async (path, data) => {
          if (isDeno && Deno)
            return await Deno.writeTextFile(path, data);
          if (isJava && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            const StandardCharsets = Java.type("java.nio.charset.StandardCharsets");
            Files.write(Paths.get(path), new Java.type("java.lang.String")(data).getBytes(StandardCharsets.UTF_8));
            return;
          }
          throw new Error("writeTextFile not supported in this environment");
        },
        mkdir: async (path) => {
          if (isDeno && Deno)
            return await Deno.mkdir(path, { recursive: true });
          if (isJava && Java) {
            const Files = Java.type("java.nio.file.Files");
            const Paths = Java.type("java.nio.file.Paths");
            Files.createDirectories(Paths.get(path));
            return;
          }
          throw new Error("mkdir not supported in this environment");
        }
      };
    }
  });

  // dist/frontend/errors.js
  var require_errors = __commonJS({
    "dist/frontend/errors.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FunctionError = exports.AssignmentError = exports.ResolutionError = exports.DeclarationError = exports.ComparisonError = exports.CalculationError = exports.InterpretError = exports.ParseError = void 0;
      var CustomError = class _CustomError extends Error {
        constructor(message) {
          super(message);
          if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, _CustomError);
          }
          this.name = this.constructor.name;
        }
      };
      var ParseError = class extends CustomError {
        constructor(message) {
          super(message);
        }
      };
      exports.ParseError = ParseError;
      var InterpretError = class extends CustomError {
        constructor(message) {
          super(message);
        }
      };
      exports.InterpretError = InterpretError;
      var CalculationError = class extends CustomError {
        constructor(message) {
          super(message);
        }
      };
      exports.CalculationError = CalculationError;
      var ComparisonError = class extends CustomError {
        constructor(message) {
          super(message);
        }
      };
      exports.ComparisonError = ComparisonError;
      var DeclarationError = class extends CustomError {
        constructor(message) {
          super(message);
        }
      };
      exports.DeclarationError = DeclarationError;
      var ResolutionError = class extends CustomError {
        constructor(message) {
          super(message);
        }
      };
      exports.ResolutionError = ResolutionError;
      var AssignmentError = class extends CustomError {
        constructor(message) {
          super(message);
        }
      };
      exports.AssignmentError = AssignmentError;
      var FunctionError = class extends CustomError {
        constructor(message) {
          super(message);
        }
      };
      exports.FunctionError = FunctionError;
    }
  });

  // dist/frontend/lexer.js
  var require_lexer = __commonJS({
    "dist/frontend/lexer.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.TokenType = void 0;
      exports.tokenize = tokenize;
      var compat_js_1 = require_compat();
      var errors_js_1 = require_errors();
      var TokenType;
      (function(TokenType2) {
        TokenType2[TokenType2["Number"] = 0] = "Number";
        TokenType2[TokenType2["Identifier"] = 1] = "Identifier";
        TokenType2[TokenType2["Function"] = 2] = "Function";
        TokenType2[TokenType2["If"] = 3] = "If";
        TokenType2[TokenType2["Equals"] = 4] = "Equals";
        TokenType2[TokenType2["Comparison"] = 5] = "Comparison";
        TokenType2[TokenType2["Comma"] = 6] = "Comma";
        TokenType2[TokenType2["Dot"] = 7] = "Dot";
        TokenType2[TokenType2["Colon"] = 8] = "Colon";
        TokenType2[TokenType2["Quotation"] = 9] = "Quotation";
        TokenType2[TokenType2["Semicolon"] = 10] = "Semicolon";
        TokenType2[TokenType2["OpenParen"] = 11] = "OpenParen";
        TokenType2[TokenType2["CloseParen"] = 12] = "CloseParen";
        TokenType2[TokenType2["OpenBrace"] = 13] = "OpenBrace";
        TokenType2[TokenType2["CloseBrace"] = 14] = "CloseBrace";
        TokenType2[TokenType2["OpenBracket"] = 15] = "OpenBracket";
        TokenType2[TokenType2["CloseBracket"] = 16] = "CloseBracket";
        TokenType2[TokenType2["BinaryOperator"] = 17] = "BinaryOperator";
        TokenType2[TokenType2["Let"] = 18] = "Let";
        TokenType2[TokenType2["Const"] = 19] = "Const";
        TokenType2[TokenType2["String"] = 20] = "String";
        TokenType2[TokenType2["Return"] = 21] = "Return";
        TokenType2[TokenType2["EOF"] = 22] = "EOF";
      })(TokenType || (exports.TokenType = TokenType = {}));
      var KEYWORDS = {
        let: TokenType.Let,
        const: TokenType.Const,
        function: TokenType.Function,
        if: TokenType.If,
        return: TokenType.Return
      };
      function CreateToken(value = "", type) {
        return { value, type };
      }
      function IsAlpha(src) {
        return src.toUpperCase() != src.toLowerCase();
      }
      function IsInt(src) {
        const c = src.charCodeAt(0);
        const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
        return c >= bounds[0] && c <= bounds[1];
      }
      function IsSkippable(src) {
        return src == " " || src == "\n" || src == "	" || src == "\r";
      }
      function ProcessStringLiteral(src) {
        const quote = src.shift();
        let string = "";
        while (src.length > 0 && src[0] !== quote) {
          if (src[0] === "\n" || src[0] === "\r") {
            throw new errors_js_1.ParseError("Unterminated string literal: newline found before closing quote");
          }
          if (src[0] === "\\") {
            src.shift();
            if (src.length > 0) {
              const escapeChar = src.shift();
              switch (escapeChar) {
                case "n":
                  string += "\n";
                  break;
                case "t":
                  string += "	";
                  break;
                case "r":
                  string += "\r";
                  break;
                case "\\":
                  string += "\\";
                  break;
                case "'":
                  string += "'";
                  break;
                case '"':
                  string += '"';
                  break;
                default:
                  string += escapeChar;
              }
            }
          } else {
            string += src.shift();
          }
        }
        if (src.length === 0) {
          throw new errors_js_1.ParseError("Unterminated string literal: reached end of file before closing quote");
        }
        src.shift();
        return { value: string, remaining: src };
      }
      function tokenize(sourceCode) {
        const tokens = new Array();
        let src = sourceCode.split("");
        while (src.length > 0) {
          if (src[0] == "/" && src[1] == "/") {
            while (src.length > 0 && src[0] != "\n") {
              src.shift();
            }
            src.shift();
          } else if (src[0] == "/" && src[1] == "*") {
            while (src.length > 1 && !(src[0] == "*" && src[1] == "/")) {
              src.shift();
            }
            if (src.length > 1) {
              src.shift();
              src.shift();
            } else {
              throw new errors_js_1.ParseError("Unterminated multi-line comment");
            }
          } else if (src[0] == "(") {
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
          } else if (src[0] == "=") {
            if (src.length > 1 && src[1] == "=") {
              src.shift();
              src.shift();
              tokens.push(CreateToken("==", TokenType.Comparison));
            } else {
              tokens.push(CreateToken(src.shift(), TokenType.Equals));
            }
          } else if (src[0] == "!") {
            if (src.length > 1 && src[1] == "=") {
              src.shift();
              src.shift();
              tokens.push(CreateToken("!=", TokenType.Comparison));
            } else {
              console.log("Unrecognised character in source:", src[0]);
              compat_js_1.compat.exit(1);
            }
          } else if (src[0] == ">") {
            if (src.length > 1 && src[1] == "=") {
              src.shift();
              src.shift();
              tokens.push(CreateToken(">=", TokenType.Comparison));
            } else {
              tokens.push(CreateToken(src.shift(), TokenType.Comparison));
            }
          } else if (src[0] == "<") {
            if (src.length > 1 && src[1] == "=") {
              src.shift();
              src.shift();
              tokens.push(CreateToken("<=", TokenType.Comparison));
            } else {
              tokens.push(CreateToken(src.shift(), TokenType.Comparison));
            }
          } else if (src[0] == ";") {
            tokens.push(CreateToken(src.shift(), TokenType.Semicolon));
          } else if (src[0] == ":") {
            tokens.push(CreateToken(src.shift(), TokenType.Colon));
          } else if (src[0] == '"' || src[0] == "'") {
            const { value, remaining } = ProcessStringLiteral(src);
            src = remaining;
            tokens.push(CreateToken(value, TokenType.String));
          } else if (src[0] == ",") {
            tokens.push(CreateToken(src.shift(), TokenType.Comma));
          } else if (src[0] == ".") {
            tokens.push(CreateToken(src.shift(), TokenType.Dot));
          } else {
            if (IsInt(src[0]) || src[0] === "-" && IsInt(src[1])) {
              let num = src.shift();
              if (num === "-" && IsInt(src[0])) {
                num += src.shift();
              }
              let hasDecimal = false;
              while (src.length > 0 && (IsInt(src[0]) || src[0] === ".")) {
                if (src[0] === ".") {
                  if (hasDecimal)
                    break;
                  hasDecimal = true;
                }
                num += src.shift();
              }
              tokens.push(CreateToken(num, TokenType.Number));
            } else if (src[0] == "+" || src[0] == "-" || src[0] == "*" || src[0] == "/" || src[0] == "%") {
              tokens.push(CreateToken(src.shift(), TokenType.BinaryOperator));
            } else if (IsAlpha(src[0])) {
              let ident = "";
              while (src.length > 0 && IsAlpha(src[0])) {
                ident += src.shift();
              }
              const reserved = KEYWORDS[ident];
              if (typeof reserved == "number") {
                tokens.push(CreateToken(ident, reserved));
              } else {
                tokens.push(CreateToken(ident, TokenType.Identifier));
              }
            } else if (IsSkippable(src[0])) {
              src.shift();
            } else {
              console.log("Unrecognised character in source:", src[0]);
              compat_js_1.compat.exit(1);
            }
          }
        }
        tokens.push({ type: TokenType.EOF, value: "EndOfFile" });
        return tokens;
      }
    }
  });

  // dist/frontend/parser.js
  var require_parser = __commonJS({
    "dist/frontend/parser.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var lexer_js_1 = require_lexer();
      var errors_js_1 = require_errors();
      var Parser = class {
        constructor() {
          this.tokens = [];
        }
        /**
         * Turns source code into an AST
         * @param sourceCode The source code to parse
         * @returns A Program node representing the AST
         */
        ProduceAST(sourceCode) {
          this.tokens = (0, lexer_js_1.tokenize)(sourceCode);
          const program = {
            kind: "Program",
            body: []
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
        NotEOF() {
          return this.tokens[0].type != lexer_js_1.TokenType.EOF;
        }
        /**
         * Returns the current token without consuming it
         */
        At() {
          return this.tokens[0];
        }
        /**
         * Consumes and returns the current token
         */
        Next() {
          const prev = this.tokens.shift();
          return prev;
        }
        /**
         * Expects a specific token type and throws an error if not matched
         */
        Expect(type, error) {
          const prev = this.tokens.shift();
          if (!prev || prev.type !== type) {
            if (error) {
              throw new errors_js_1.ParseError(error);
            } else {
              throw new errors_js_1.ParseError(`Unexpected token found while parsing. Expected: ${lexer_js_1.TokenType[type]}, found: { type: ${lexer_js_1.TokenType[prev.type]}, value: ${prev.value} }`);
            }
          }
          return prev;
        }
        /**
         * this.Expect() but just for semicolons
         */
        ExpectSemicolon(context = "statement") {
          return this.Expect(lexer_js_1.TokenType.Semicolon, `Expected ';' at the end of ${context}.`);
        }
        // ===== Statement Parsing Methods =====
        /**
         * Parses a statement
         */
        ParseStatement() {
          switch (this.At().type) {
            case lexer_js_1.TokenType.Let:
            case lexer_js_1.TokenType.Const:
              return this.ParseVariableDeclaration();
            case lexer_js_1.TokenType.Function:
              return this.ParseFunctionDeclaration();
            case lexer_js_1.TokenType.If:
              return this.ParseIfStatement();
            case lexer_js_1.TokenType.Identifier: {
              if (this.At().value === "for") {
                return this.ParseForExpression();
              } else if (this.At().value === "while") {
                return this.ParseWhileExpression();
              }
              const expr = this.ParseExpression();
              this.ExpectSemicolon("expression");
              return expr;
            }
            case lexer_js_1.TokenType.Return: {
              this.Next();
              const value = this.At().type !== lexer_js_1.TokenType.Semicolon ? this.ParseExpression() : void 0;
              this.ExpectSemicolon("return statement");
              return {
                kind: "ReturnStatement",
                value
              };
            }
            default: {
              const expr = this.ParseExpression();
              this.ExpectSemicolon("expression");
              return expr;
            }
          }
        }
        /**
         * Parses a for expression
         */
        ParseForExpression() {
          this.Next();
          this.Expect(lexer_js_1.TokenType.OpenParen, "Expected '(' after 'for'.");
          const amount = this.ParseExpression();
          this.Expect(lexer_js_1.TokenType.CloseParen, "Expected ')' after 'for' amount.");
          this.Expect(lexer_js_1.TokenType.OpenBrace, "Expected '{' to start 'for' block.");
          const body = [];
          while (this.NotEOF() && this.At().type !== lexer_js_1.TokenType.CloseBrace) {
            body.push(this.ParseStatement());
          }
          this.Expect(lexer_js_1.TokenType.CloseBrace, "Expected '}' to close 'for' block.");
          return {
            kind: "ForExpression",
            amount,
            body
          };
        }
        /**
         * Parses a while expression
         */
        ParseWhileExpression() {
          this.Next();
          this.Expect(lexer_js_1.TokenType.OpenParen, "Expected '(' after 'while'.");
          const condition = this.ParseExpression();
          this.Expect(lexer_js_1.TokenType.CloseParen, "Expected ')' after 'while' condition.");
          this.Expect(lexer_js_1.TokenType.OpenBrace, "Expected '{' to start 'while' block.");
          const body = [];
          while (this.NotEOF() && this.At().type !== lexer_js_1.TokenType.CloseBrace) {
            body.push(this.ParseStatement());
          }
          this.Expect(lexer_js_1.TokenType.CloseBrace, "Expected '}' to close 'while' block.");
          return {
            kind: "WhileExpression",
            condition,
            body
          };
        }
        /**
         * Parses a variable declaration
         */
        ParseVariableDeclaration() {
          const isConstant = this.Next().type == lexer_js_1.TokenType.Const;
          const identifier = this.Expect(lexer_js_1.TokenType.Identifier, "Expected variable name after declaration keyword.").value;
          if (this.At().type == lexer_js_1.TokenType.Semicolon) {
            this.Next();
            if (isConstant) {
              throw new errors_js_1.ParseError(`Must assign value to consant expression ${identifier}. No value provided.`);
            }
            return {
              kind: "VariableDeclaration",
              identifier,
              constant: false
            };
          }
          this.Expect(lexer_js_1.TokenType.Equals, `Expected '=' after variable name '${identifier}'.`);
          const declaration = {
            kind: "VariableDeclaration",
            value: this.ParseExpression(),
            identifier,
            constant: isConstant
          };
          this.ExpectSemicolon("variable declaration");
          return declaration;
        }
        /**
         * Parses a function declaration
         */
        ParseFunctionDeclaration() {
          this.Next();
          const name = this.Expect(lexer_js_1.TokenType.Identifier, "Expected function name following keyword.").value;
          const args = this.ParseArgs();
          const parameters = [];
          for (const arg of args) {
            if (arg.kind != "Identifier") {
              throw new errors_js_1.FunctionError("Expected parameters inside function declaration to be of type string");
            }
            parameters.push(arg.symbol);
          }
          this.Expect(lexer_js_1.TokenType.OpenBrace, "Expected function body following declaration.");
          const body = [];
          while (this.NotEOF() && this.At().type != lexer_js_1.TokenType.CloseBrace) {
            body.push(this.ParseStatement());
          }
          this.Expect(lexer_js_1.TokenType.CloseBrace);
          const func = {
            body,
            name,
            parameters,
            kind: "FunctionDeclaration",
            async: false
          };
          return func;
        }
        /**
         * Parses an if statement
         */
        ParseIfStatement() {
          this.Expect(lexer_js_1.TokenType.If, "Expected 'if' keyword.");
          this.Expect(lexer_js_1.TokenType.OpenParen, "Expected '(' after 'if' keyword.");
          const condition = this.ParseExpression();
          this.Expect(lexer_js_1.TokenType.CloseParen, "Expected ')' after 'if' condition.");
          this.Expect(lexer_js_1.TokenType.OpenBrace, "Expected '{' to start 'if' block.");
          const thenBranch = [];
          while (this.NotEOF() && this.At().type != lexer_js_1.TokenType.CloseBrace) {
            thenBranch.push(this.ParseStatement());
          }
          this.Expect(lexer_js_1.TokenType.CloseBrace, "Expected '}' to close 'if' block.");
          let elseBranch = void 0;
          if (this.At().type == lexer_js_1.TokenType.Identifier && this.At().value === "else") {
            this.Next();
            this.Expect(lexer_js_1.TokenType.OpenBrace, "Expected '{' to start 'else' block.");
            elseBranch = [];
            while (this.NotEOF() && this.At().type != lexer_js_1.TokenType.CloseBrace) {
              elseBranch.push(this.ParseStatement());
            }
            this.Expect(lexer_js_1.TokenType.CloseBrace, "Expected '}' to close 'else' block.");
          }
          return {
            kind: "IfStatement",
            condition,
            thenBranch,
            elseBranch
          };
        }
        // ===== Expression Parsing Methods =====
        /**
         * Entry point for parsing expressions
         */
        ParseExpression() {
          return this.ParseAssignmentExpression();
        }
        /**
         * Parses assignment expressions
         */
        ParseAssignmentExpression() {
          const left = this.ParseObjectExpression();
          if (this.At().type == lexer_js_1.TokenType.Equals) {
            this.Next();
            const value = this.ParseAssignmentExpression();
            return {
              value,
              assignee: left,
              kind: "AssignmentExpression"
            };
          }
          return left;
        }
        /**
         * Parses object literals
         */
        ParseObjectExpression() {
          if (this.At().type == lexer_js_1.TokenType.OpenBracket) {
            return this.ParseArrayExpression();
          }
          if (this.At().type != lexer_js_1.TokenType.OpenBrace)
            return this.ParseComparisonExpression();
          this.Next();
          const properties = new Array();
          while (this.NotEOF() && this.At().type != lexer_js_1.TokenType.CloseBrace) {
            const key = this.Expect(lexer_js_1.TokenType.Identifier, "Expected identifier as key in object literal.").value;
            if (this.At().type == lexer_js_1.TokenType.Comma) {
              this.Next();
              properties.push({
                key,
                kind: "Property",
                value: void 0
              });
              continue;
            } else if (this.At().type == lexer_js_1.TokenType.CloseBrace) {
              properties.push({ key, kind: "Property", value: void 0 });
              continue;
            }
            this.Expect(lexer_js_1.TokenType.Colon, "Expected ':' after key in object literal.");
            const value = this.ParseExpression();
            properties.push({ kind: "Property", value, key });
            if (this.At().type != lexer_js_1.TokenType.CloseBrace) {
              this.Expect(lexer_js_1.TokenType.Comma, "Expected comma or closing brace following property.");
            }
          }
          this.Expect(lexer_js_1.TokenType.CloseBrace, `Expected '}' to close object literal, found '${this.At().value}'.`);
          return { kind: "ObjectLiteral", properties };
        }
        /**
         * Parses array literal expressions
         */
        ParseArrayExpression() {
          this.Expect(lexer_js_1.TokenType.OpenBracket, "Expected '[' to start array literal.");
          const elements = [];
          while (this.NotEOF() && this.At().type != lexer_js_1.TokenType.CloseBracket) {
            elements.push(this.ParseExpression());
            if (this.At().type == lexer_js_1.TokenType.Comma) {
              this.Next();
            } else if (this.At().type != lexer_js_1.TokenType.CloseBracket) {
              throw new errors_js_1.ParseError(`Unexpected token found in array literal: { type: ${lexer_js_1.TokenType[this.At().type]}, value: ${this.At().value} }`);
            }
          }
          this.Expect(lexer_js_1.TokenType.CloseBracket, "Expected ']' to close array literal.");
          return { kind: "ArrayLiteral", elements };
        }
        /**
         * Parses additive expressions (+, -)
         */
        ParseAdditiveExpression() {
          let left = this.ParseMultiplicativeExpression();
          while (this.At().value == "+" || this.At().value == "-") {
            const operator = this.Next().value;
            const right = this.ParseMultiplicativeExpression();
            left = {
              kind: "BinaryExpression",
              left,
              right,
              operator
            };
          }
          return left;
        }
        /**
         * Parses multiplicative expressions (*, /, %)
         */
        ParseMultiplicativeExpression() {
          let left = this.ParseCallMemberExpression();
          while (this.At().value == "*" || this.At().value == "/" || this.At().value == "%") {
            const operator = this.Next().value;
            const right = this.ParseCallMemberExpression();
            left = {
              kind: "BinaryExpression",
              left,
              right,
              operator
            };
          }
          return left;
        }
        /**
         * Parses comparison expressions (==, !=, >, <, >=, <=)
         */
        ParseComparisonExpression() {
          let left = this.ParseAdditiveExpression();
          while (this.At().value == "==" || this.At().value == "!=" || this.At().value == ">=" || this.At().value == "<=" || this.At().value == ">" || this.At().value == "<") {
            const operator = this.Next().value;
            const right = this.ParseAdditiveExpression();
            left = {
              kind: "ComparisonExpression",
              left,
              right,
              operator
            };
          }
          return left;
        }
        /**
         * Parses function call and member expressions
         */
        ParseCallMemberExpression() {
          const member = this.ParseMemberExpression();
          if (this.At().type == lexer_js_1.TokenType.OpenParen) {
            return this.ParseCallExpression(member);
          }
          return member;
        }
        /**
         * Parses function call expressions
         */
        ParseCallExpression(caller) {
          let callExpression = {
            kind: "CallExpression",
            caller,
            args: this.ParseArgs()
          };
          if (this.At().type == lexer_js_1.TokenType.OpenParen) {
            callExpression = this.ParseCallExpression(callExpression);
          }
          return callExpression;
        }
        /**
         * Parses function arguments
         */
        ParseArgs() {
          this.Expect(lexer_js_1.TokenType.OpenParen);
          const args = this.At().type == lexer_js_1.TokenType.CloseParen ? [] : this.ParseArgumentsList();
          this.Expect(lexer_js_1.TokenType.CloseParen, "Missing closing parenthesis inside arguments list.");
          return args;
        }
        /**
         * Parses a list of function arguments
         */
        ParseArgumentsList() {
          const args = [this.ParseAssignmentExpression()];
          while (this.At().type == lexer_js_1.TokenType.Comma && this.Next()) {
            args.push(this.ParseAssignmentExpression());
          }
          return args;
        }
        /**
         * Parses member expressions (obj.prop or obj[prop])
         */
        ParseMemberExpression() {
          let object = this.ParsePrimaryExpression();
          while (this.At().type == lexer_js_1.TokenType.Dot || this.At().type == lexer_js_1.TokenType.OpenBracket) {
            const operator = this.Next();
            let property;
            let computed;
            if (operator.type == lexer_js_1.TokenType.Dot) {
              computed = false;
              property = this.ParsePrimaryExpression();
              if (property.kind != "Identifier") {
                throw new errors_js_1.ParseError("Cannot use dot operator without identifier.");
              }
            } else {
              computed = true;
              property = this.ParseExpression();
              this.Expect(lexer_js_1.TokenType.CloseBracket, "Missing closing bracket in computed value.");
            }
            object = {
              kind: "MemberExpression",
              object,
              property,
              computed
            };
          }
          return object;
        }
        /**
         * Parses primary expressions (identifiers, literals, grouped expressions)
         */
        ParsePrimaryExpression() {
          const token = this.At().type;
          switch (token) {
            case lexer_js_1.TokenType.Identifier:
              return {
                kind: "Identifier",
                symbol: this.Next().value
              };
            case lexer_js_1.TokenType.Number:
              return {
                kind: "NumericLiteral",
                value: parseFloat(this.Next().value)
              };
            case lexer_js_1.TokenType.OpenParen: {
              this.Next();
              const value = this.ParseExpression();
              this.Expect(lexer_js_1.TokenType.CloseParen, "Expected closing ')' after expression.");
              return value;
            }
            case lexer_js_1.TokenType.String:
              return {
                kind: "StringLiteral",
                value: this.Next().value
              };
            default:
              throw new errors_js_1.ParseError(`Unexpected token found while parsing: { type: ${lexer_js_1.TokenType[this.At().type]}, value: ${this.At().value} }`);
          }
        }
      };
      exports.default = Parser;
    }
  });

  // dist/runtime/values.js
  var require_values = __commonJS({
    "dist/runtime/values.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.MakeNumber = MakeNumber;
      exports.MakeNull = MakeNull;
      exports.MakeBool = MakeBool;
      exports.MakeInternalCall = MakeInternalCall;
      exports.MakeString = MakeString;
      exports.MakeArray = MakeArray;
      exports.MakeReturn = MakeReturn;
      function MakeNumber(n = 0) {
        return { type: "number", value: n };
      }
      function MakeNull() {
        return { type: "null", value: null };
      }
      function MakeBool(b = true) {
        return { type: "boolean", value: b };
      }
      function MakeInternalCall(call) {
        return { type: "internal-call", call };
      }
      function MakeString(s = "") {
        return { type: "string", value: s };
      }
      function MakeArray(elements = []) {
        return { type: "array", elements };
      }
      function MakeReturn(value) {
        return { type: "return", value };
      }
    }
  });

  // dist/frontend/eval/statements.js
  var require_statements = __commonJS({
    "dist/frontend/eval/statements.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.EvaluateProgram = EvaluateProgram;
      exports.EvaluateVariableDeclaration = EvaluateVariableDeclaration;
      exports.EvaluateFunctionDeclaration = EvaluateFunctionDeclaration;
      exports.EvaluateReturnStatement = EvaluateReturnStatement;
      var interpreter_js_1 = require_interpreter();
      var values_js_1 = require_values();
      function EvaluateProgram(program, env) {
        let lastEvaluated = (0, values_js_1.MakeNull)();
        for (const statement of program.body) {
          lastEvaluated = (0, interpreter_js_1.Evaluate)(statement, env);
        }
        return lastEvaluated;
      }
      function EvaluateVariableDeclaration(declaration, env) {
        const value = declaration.value ? (0, interpreter_js_1.Evaluate)(declaration.value, env) : (0, values_js_1.MakeNull)();
        return env.declareVariable(declaration.identifier, value, declaration.constant);
      }
      function EvaluateFunctionDeclaration(declaration, env) {
        const func = {
          type: "function",
          name: declaration.name,
          parameters: declaration.parameters,
          declarationEnv: env,
          body: declaration.body
        };
        return env.declareVariable(declaration.name, func, true);
      }
      function EvaluateReturnStatement(statement, env) {
        const value = statement.value ? (0, interpreter_js_1.Evaluate)(statement.value, env) : (0, values_js_1.MakeNull)();
        return (0, values_js_1.MakeReturn)(value);
      }
    }
  });

  // dist/runtime/functions.js
  var require_functions = __commonJS({
    "dist/runtime/functions.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.TimeFunction = TimeFunction;
      exports.PrintFunction = PrintFunction;
      exports.IfFunction = IfFunction;
      exports.NatFunction = NatFunction;
      exports.IntFunction = IntFunction;
      exports.FloatFunction = FloatFunction;
      exports.StringFunction = StringFunction;
      exports.AbsFunction = AbsFunction;
      exports.RoundFunction = RoundFunction;
      exports.FloorFunction = FloorFunction;
      exports.CeilFunction = CeilFunction;
      var environment_js_1 = __importDefault(require_environment());
      var interpreter_js_1 = require_interpreter();
      var values_js_1 = require_values();
      function TimeFunction() {
        return (0, values_js_1.MakeNumber)(Date.now());
      }
      function PrintFunction(args) {
        const values = args.map(valueToString);
        console.log(...values);
        return (0, values_js_1.MakeNull)();
      }
      function IfFunction(args, env) {
        if (args.length < 2) {
          console.log("Error: 'if' requires at least 2 arguments (condition, then)");
          return (0, values_js_1.MakeNull)();
        }
        const condition = args[0];
        let conditionResult = false;
        if (condition.type === "boolean") {
          conditionResult = condition.value;
        } else if (condition.type === "number") {
          conditionResult = condition.value !== 0;
        } else if (condition.type === "string") {
          conditionResult = condition.value !== "";
        } else if (condition.type === "null") {
          conditionResult = false;
        } else {
          conditionResult = true;
        }
        const branchToExecute = conditionResult ? args.length >= 2 ? args[1] : (0, values_js_1.MakeNull)() : args.length >= 3 ? args[2] : (0, values_js_1.MakeNull)();
        if (branchToExecute.type === "function") {
          const fn = branchToExecute;
          const scope = new environment_js_1.default(fn.declarationEnv);
          let result = (0, values_js_1.MakeNull)();
          for (const stmt of fn.body) {
            result = (0, interpreter_js_1.Evaluate)(stmt, scope);
          }
          return result;
        } else if (branchToExecute.type === "internal-call") {
          return branchToExecute.call([], env);
        } else {
          return branchToExecute;
        }
      }
      function NatFunction(args) {
        if (args.length > 1) {
          console.log("Nat only accepts one argument at a time.");
          return (0, values_js_1.MakeNull)();
        }
        if (args.length === 0) {
          console.log("Nat needs an input to respond to.");
          return (0, values_js_1.MakeNull)();
        }
        const arg = args[0];
        let input;
        switch (arg.type) {
          case "string":
            input = arg.value;
            break;
          case "number":
            input = String(arg.value);
            break;
          case "boolean":
            input = String(arg.value);
            break;
          case "null":
            input = "null";
            break;
          case "object":
            input = "{object}";
            break;
          case "internal-call":
            input = "{function}";
            break;
          default:
            input = "unknown";
        }
        let response;
        if (input.toLowerCase().includes("save")) {
          response = "Saving...Saved";
        } else if (input.toLowerCase().includes("7")) {
          response = `Nat says that "${input}" does not exist.`;
        } else if (input.toLowerCase().includes("4") || input.toLowerCase().includes("2")) {
          response = `Nat says that "${input}" does exist.`;
        } else {
          response = `Nat doesn't understand "${input}", so she just smiles and nods as you yap away about it.`;
        }
        return (0, values_js_1.MakeString)(response);
      }
      function IntFunction(args) {
        if (args.length !== 1) {
          console.log("int() only accepts one argument.");
          return (0, values_js_1.MakeNull)();
        }
        const arg = args[0];
        if (arg.type === "number") {
          return arg;
        } else if (arg.type === "string") {
          const str = arg.value;
          const num = parseInt(str, 10);
          return (0, values_js_1.MakeNumber)(num);
        } else {
          console.log("int() only accepts numbers or strings.");
          return (0, values_js_1.MakeNull)();
        }
      }
      function FloatFunction(args) {
        if (args.length !== 1) {
          console.log("float() only accepts one argument.");
          return (0, values_js_1.MakeNull)();
        }
        const arg = args[0];
        if (arg.type === "number") {
          return arg;
        } else if (arg.type === "string") {
          const str = arg.value;
          const num = parseFloat(str);
          return (0, values_js_1.MakeNumber)(num);
        } else {
          console.log("float() only accepts numbers or strings.");
          return (0, values_js_1.MakeNull)();
        }
      }
      function StringFunction(args) {
        if (args.length !== 1) {
          console.log("String only accepts one argument.");
          return (0, values_js_1.MakeNull)();
        }
        const arg = args[0];
        if (arg.type === "string") {
          return arg;
        } else if (arg.type === "number") {
          const str = String(arg.value);
          return (0, values_js_1.MakeString)(str);
        } else if (arg.type === "boolean") {
          const str = String(arg.value);
          return (0, values_js_1.MakeString)(str);
        } else {
          console.log("String only accepts strings or numbers.");
          return (0, values_js_1.MakeNull)();
        }
      }
      function AbsFunction(args) {
        if (args.length != 1) {
          console.log("abs() only accepts one argument.");
          return (0, values_js_1.MakeNull)();
        }
        const arg = args[0];
        if (arg.type === "number") {
          const num = arg.value;
          return (0, values_js_1.MakeNumber)(Math.abs(num));
        } else {
          console.log("abs() only accepts numbers.");
          return (0, values_js_1.MakeNull)();
        }
      }
      function RoundFunction(args) {
        if (args.length != 1) {
          console.log("round() only accepts one argument.");
          return (0, values_js_1.MakeNull)();
        }
        const arg = args[0];
        if (arg.type === "number") {
          const num = arg.value;
          return (0, values_js_1.MakeNumber)(Math.round(num));
        } else {
          console.log("round() only accepts numbers.");
          return (0, values_js_1.MakeNull)();
        }
      }
      function FloorFunction(args) {
        if (args.length != 1) {
          console.log("floor() only accepts one argument.");
          return (0, values_js_1.MakeNull)();
        }
        const arg = args[0];
        if (arg.type === "number") {
          const num = arg.value;
          return (0, values_js_1.MakeNumber)(Math.floor(num));
        } else {
          console.log("floor() only accepts numbers.");
          return (0, values_js_1.MakeNull)();
        }
      }
      function CeilFunction(args) {
        if (args.length != 1) {
          console.log("ceil() only accepts one argument.");
          return (0, values_js_1.MakeNull)();
        }
        const arg = args[0];
        if (arg.type === "number") {
          const num = arg.value;
          return (0, values_js_1.MakeNumber)(Math.ceil(num));
        } else {
          console.log("ceil() only accepts numbers.");
          return (0, values_js_1.MakeNull)();
        }
      }
      function valueToString(value) {
        switch (value.type) {
          case "string":
            return value.value;
          case "number":
            return String(value.value);
          case "boolean":
            return String(value.value);
          case "null":
            return "null";
          case "object":
            return "{object}";
          case "array": {
            const arrayValue = value;
            const elements = arrayValue.elements.map(valueToString);
            return `[${elements.join(", ")}]`;
          }
          default:
            return String(value);
        }
      }
    }
  });

  // dist/runtime/environment.js
  var require_environment = __commonJS({
    "dist/runtime/environment.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CreateGlobalEnv = CreateGlobalEnv;
      var errors_js_1 = require_errors();
      var values_js_1 = require_values();
      var functions_js_1 = require_functions();
      function CreateGlobalEnv() {
        const env = new Environment();
        const globals = [
          ["null", (0, values_js_1.MakeNull)()],
          ["undefined", (0, values_js_1.MakeNull)()],
          ["true", (0, values_js_1.MakeBool)(true)],
          ["false", (0, values_js_1.MakeBool)(false)],
          ["brewver", (0, values_js_1.MakeString)("Brew v2.3.0")],
          ["print", (0, values_js_1.MakeInternalCall)(functions_js_1.PrintFunction)],
          ["time", (0, values_js_1.MakeInternalCall)(functions_js_1.TimeFunction)],
          ["nat", (0, values_js_1.MakeInternalCall)(functions_js_1.NatFunction)],
          ["int", (0, values_js_1.MakeInternalCall)(functions_js_1.IntFunction)],
          ["float", (0, values_js_1.MakeInternalCall)(functions_js_1.FloatFunction)],
          ["str", (0, values_js_1.MakeInternalCall)(functions_js_1.StringFunction)],
          ["abs", (0, values_js_1.MakeInternalCall)(functions_js_1.AbsFunction)],
          ["round", (0, values_js_1.MakeInternalCall)(functions_js_1.RoundFunction)],
          ["floor", (0, values_js_1.MakeInternalCall)(functions_js_1.FloorFunction)],
          ["ceil", (0, values_js_1.MakeInternalCall)(functions_js_1.CeilFunction)]
        ];
        for (const [name, value] of globals) {
          env.declareVariable(name, value, true);
        }
        return env;
      }
      var Environment = class {
        constructor(parentEnv) {
          this.parent = parentEnv;
          this.variables = /* @__PURE__ */ new Map();
          this.constants = /* @__PURE__ */ new Set();
        }
        /**
         * Makes a new variable in this scope
         */
        declareVariable(varname, value, constant) {
          if (this.variables.has(varname)) {
            throw new errors_js_1.DeclarationError(`Cannot declare variable ${varname}: Already declared.`);
          }
          this.variables.set(varname, value);
          if (constant)
            this.constants.add(varname);
          return value;
        }
        /**
         * Updates the value of an existing (non-const) var
         */
        assignVariable(varname, value) {
          const env = this.resolve(varname);
          if (env.constants.has(varname)) {
            throw new errors_js_1.AssignmentError(`Cannot assign to variable '${varname}': Is constant.`);
          }
          env.variables.set(varname, value);
          return value;
        }
        /**
         * Gets the value of a var, looking through scopes if needed
         */
        lookupVariable(varname) {
          const env = this.resolve(varname);
          return env.variables.get(varname);
        }
        /**
         * Figures out where the var actually lives
         */
        resolve(varname) {
          if (this.variables.has(varname))
            return this;
          if (this.parent == void 0)
            throw new errors_js_1.ResolutionError(`Cannot resolve '${varname}': Does not exist.`);
          return this.parent.resolve(varname);
        }
      };
      exports.default = Environment;
    }
  });

  // dist/frontend/eval/expressions.js
  var require_expressions = __commonJS({
    "dist/frontend/eval/expressions.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.EvaluateBinaryExpression = EvaluateBinaryExpression;
      exports.EvaluateComparisonExpression = EvaluateComparisonExpression;
      exports.EvaluateIdentifier = EvaluateIdentifier;
      exports.EvaluateObjectExpression = EvaluateObjectExpression;
      exports.EvaluateIfStatement = EvaluateIfStatement;
      exports.EvaluateCallExpression = EvaluateCallExpression;
      exports.EvaluateAssignment = EvaluateAssignment;
      exports.EvaluateForExpression = EvaluateForExpression;
      exports.EvaluateWhileExpression = EvaluateWhileExpression;
      exports.EvaluateArrayExpression = EvaluateArrayExpression;
      exports.EvaluateMemberExpression = EvaluateMemberExpression;
      var interpreter_js_1 = require_interpreter();
      var values_js_1 = require_values();
      var environment_js_1 = __importDefault(require_environment());
      var errors_js_1 = require_errors();
      function EvaluateBinaryExpression(binop, env) {
        const left = (0, interpreter_js_1.Evaluate)(binop.left, env);
        const right = (0, interpreter_js_1.Evaluate)(binop.right, env);
        if (binop.operator === "+" && (left.type === "string" || right.type === "string")) {
          const leftStr = left.type === "string" ? left.value : valueToString(left);
          const rightStr = right.type === "string" ? right.value : valueToString(right);
          return (0, values_js_1.MakeString)(leftStr + rightStr);
        }
        if (left.type === "number" && right.type === "number") {
          return EvaluateNumericBinaryExpression(left, right, binop.operator);
        }
        return (0, values_js_1.MakeNull)();
      }
      function EvaluateNumericBinaryExpression(left, right, operator) {
        const leftVal = left.value;
        const rightVal = right.value;
        let result;
        switch (operator) {
          case "+":
            result = leftVal + rightVal;
            break;
          case "-":
            result = leftVal - rightVal;
            break;
          case "*":
            result = leftVal * rightVal;
            break;
          case "/":
            if (rightVal === 0) {
              throw new errors_js_1.CalculationError("Division by zero");
            }
            result = leftVal / rightVal;
            break;
          case "%":
            result = leftVal % rightVal;
            break;
          default:
            throw new errors_js_1.CalculationError(`Unsupported operator: ${operator}`);
        }
        return {
          type: "number",
          value: result
        };
      }
      function EvaluateComparisonExpression(compop, env) {
        const left = (0, interpreter_js_1.Evaluate)(compop.left, env);
        const right = (0, interpreter_js_1.Evaluate)(compop.right, env);
        if (left.type === "string" && right.type === "string") {
          const leftStr = left.value;
          const rightStr = right.value;
          return EvaluateStringComparisonExpression(leftStr, rightStr, compop.operator);
        }
        if (left.type === "number" && right.type === "number") {
          return EvaluateNumericComparisonExpression(left, right, compop.operator);
        }
        if (compop.operator === "==" || compop.operator === "!=") {
          const isEqual = left.type === right.type && valueToString(left) === valueToString(right);
          return (0, values_js_1.MakeBool)(compop.operator === "==" ? isEqual : !isEqual);
        }
        return (0, values_js_1.MakeNull)();
      }
      function EvaluateStringComparisonExpression(leftStr, rightStr, operator) {
        let result;
        switch (operator) {
          case "==":
            result = leftStr === rightStr;
            break;
          case "!=":
            result = leftStr !== rightStr;
            break;
          case ">=":
            result = leftStr >= rightStr;
            break;
          case "<=":
            result = leftStr <= rightStr;
            break;
          case ">":
            result = leftStr > rightStr;
            break;
          case "<":
            result = leftStr < rightStr;
            break;
          default:
            throw new errors_js_1.ComparisonError(`Unsupported operator for strings: ${operator}`);
        }
        return (0, values_js_1.MakeBool)(result);
      }
      function EvaluateNumericComparisonExpression(left, right, operator) {
        const leftVal = left.value;
        const rightVal = right.value;
        let result;
        switch (operator) {
          case "==":
            result = leftVal === rightVal;
            break;
          case "!=":
            result = leftVal !== rightVal;
            break;
          case ">=":
            result = leftVal >= rightVal;
            break;
          case "<=":
            result = leftVal <= rightVal;
            break;
          case ">":
            result = leftVal > rightVal;
            break;
          case "<":
            result = leftVal < rightVal;
            break;
          default:
            throw new errors_js_1.ComparisonError(`Unsupported operator: ${operator}`);
        }
        return (0, values_js_1.MakeBool)(result);
      }
      function EvaluateIfExpression(callExpr, env) {
        if (callExpr.args.length < 2) {
          throw new errors_js_1.FunctionError("'if' requires at least 2 arguments (condition, then)");
        }
        const condition = (0, interpreter_js_1.Evaluate)(callExpr.args[0], env);
        let conditionResult = false;
        if (condition.type === "boolean") {
          conditionResult = condition.value;
        } else if (condition.type === "number") {
          conditionResult = condition.value !== 0;
        } else if (condition.type === "string") {
          conditionResult = condition.value !== "";
        } else if (condition.type === "null") {
          conditionResult = false;
        } else {
          conditionResult = true;
        }
        if (conditionResult) {
          return (0, interpreter_js_1.Evaluate)(callExpr.args[1], env);
        } else if (callExpr.args.length >= 3) {
          return (0, interpreter_js_1.Evaluate)(callExpr.args[2], env);
        }
        return (0, values_js_1.MakeNull)();
      }
      function EvaluateIdentifier(ident, env) {
        const val = env.lookupVariable(ident.symbol);
        return val;
      }
      function EvaluateObjectExpression(obj, env) {
        const object = { type: "object", properties: /* @__PURE__ */ new Map() };
        for (const { key, value } of obj.properties) {
          const runtimeValue = value == void 0 ? env.lookupVariable(key) : (0, interpreter_js_1.Evaluate)(value, env);
          object.properties.set(key, runtimeValue);
        }
        return object;
      }
      function EvaluateIfStatement(ifStmt, env) {
        const condition = (0, interpreter_js_1.Evaluate)(ifStmt.condition, env);
        let conditionResult = false;
        if (condition.type === "boolean") {
          conditionResult = condition.value;
        } else if (condition.type === "number") {
          conditionResult = condition.value !== 0;
        } else if (condition.type === "string") {
          conditionResult = condition.value !== "";
        } else if (condition.type === "null") {
          conditionResult = false;
        } else {
          conditionResult = true;
        }
        let result = (0, values_js_1.MakeNull)();
        if (conditionResult) {
          for (const stmt of ifStmt.thenBranch) {
            result = (0, interpreter_js_1.Evaluate)(stmt, env);
            if (result.type === "return") {
              return result;
            }
          }
        } else if (ifStmt.elseBranch) {
          for (const stmt of ifStmt.elseBranch) {
            if (result.type === "return") {
              return result;
            }
            result = (0, interpreter_js_1.Evaluate)(stmt, env);
          }
        }
        return result;
      }
      function EvaluateCallExpression(expression, env) {
        if (expression.caller.kind === "Identifier" && expression.caller.symbol === "if") {
          return EvaluateIfExpression(expression, env);
        }
        const args = expression.args.map((arg) => (0, interpreter_js_1.Evaluate)(arg, env));
        const func = (0, interpreter_js_1.Evaluate)(expression.caller, env);
        if (func.type == "internal-call") {
          const result = func.call(args, env);
          return result;
        }
        if (func.type == "function") {
          const fn = func;
          const scope = new environment_js_1.default(fn.declarationEnv);
          for (let i = 0; i < fn.parameters.length; i++) {
            const varname = fn.parameters[i];
            scope.declareVariable(varname, args[i], false);
          }
          let result = (0, values_js_1.MakeNull)();
          for (const stmt of fn.body) {
            result = (0, interpreter_js_1.Evaluate)(stmt, scope);
            if (result.type === "return") {
              return result.value;
            }
          }
          return result;
        }
        throw new errors_js_1.FunctionError(`Cannot call value that is not a function: ${JSON.stringify(func)}`);
      }
      function EvaluateAssignment(node, env) {
        if (node.assignee.kind === "Identifier") {
          const varname = node.assignee.symbol;
          return env.assignVariable(varname, (0, interpreter_js_1.Evaluate)(node.value, env));
        }
        if (node.assignee.kind === "MemberExpression") {
          const memberExpr = node.assignee;
          const object = (0, interpreter_js_1.Evaluate)(memberExpr.object, env);
          const newValue = (0, interpreter_js_1.Evaluate)(node.value, env);
          if (object.type === "array" && memberExpr.computed) {
            const arrayValue = object;
            const indexValue = (0, interpreter_js_1.Evaluate)(memberExpr.property, env);
            if (indexValue.type !== "number") {
              throw new errors_js_1.AssignmentError(`Array index must be a number, got: ${indexValue.type}`);
            }
            const index = indexValue.value;
            if (index < 0 || index !== Math.floor(index)) {
              throw new errors_js_1.AssignmentError(`Invalid array index: ${index}`);
            }
            while (arrayValue.elements.length <= index) {
              arrayValue.elements.push((0, values_js_1.MakeNull)());
            }
            arrayValue.elements[index] = newValue;
            return newValue;
          }
          if (object.type === "object") {
            const objValue = object;
            let propertyKey;
            if (memberExpr.computed) {
              const keyValue = (0, interpreter_js_1.Evaluate)(memberExpr.property, env);
              if (keyValue.type === "string") {
                propertyKey = keyValue.value;
              } else if (keyValue.type === "number") {
                propertyKey = keyValue.value.toString();
              } else {
                throw new errors_js_1.AssignmentError(`Property key must be string or number, got: ${keyValue.type}`);
              }
            } else {
              if (memberExpr.property.kind !== "Identifier") {
                throw new errors_js_1.AssignmentError("Non-computed property access requires identifier");
              }
              propertyKey = memberExpr.property.symbol;
            }
            objValue.properties.set(propertyKey, newValue);
            return newValue;
          }
          throw new errors_js_1.AssignmentError(`Cannot assign to ${object.type} using member expression`);
        }
        throw new errors_js_1.AssignmentError(`Invalid assignment target: ${JSON.stringify(node.assignee)}`);
      }
      function valueToString(value) {
        switch (value.type) {
          case "string":
            return value.value;
          case "number":
            return value.value.toString();
          case "boolean":
            return value.value.toString();
          case "null":
            return "null";
          case "object":
            return "[object]";
          case "function":
          case "internal-call":
            return "[function]";
          default:
            return "[unknown]";
        }
      }
      function EvaluateForExpression(forExpr, env) {
        const amountValue = (0, interpreter_js_1.Evaluate)(forExpr.amount, env);
        if (amountValue.type !== "number") {
          throw new errors_js_1.FunctionError(`Expected a number for 'for' loop amount, but got ${amountValue.type}.`);
        }
        const iterations = amountValue.value;
        let result = (0, values_js_1.MakeNull)();
        for (let i = 0; i < iterations; i++) {
          for (const stmt of forExpr.body) {
            result = (0, interpreter_js_1.Evaluate)(stmt, env);
            if (result.type === "return") {
              return result;
            }
          }
        }
        return result;
      }
      function EvaluateWhileExpression(whileExpr, env) {
        let result = (0, values_js_1.MakeNull)();
        while (true) {
          const conditionValue = (0, interpreter_js_1.Evaluate)(whileExpr.condition, env);
          if (conditionValue.type !== "boolean") {
            throw new errors_js_1.FunctionError(`Expected a boolean for 'while' loop condition, but got a ${conditionValue.type}.`);
          }
          if (!conditionValue.value) {
            break;
          }
          for (const stmt of whileExpr.body) {
            result = (0, interpreter_js_1.Evaluate)(stmt, env);
          }
        }
        return result;
      }
      function EvaluateArrayExpression(arrayExpr, env) {
        const elements = arrayExpr.elements.map((elem) => (0, interpreter_js_1.Evaluate)(elem, env));
        return (0, values_js_1.MakeArray)(elements);
      }
      function EvaluateMemberExpression(expr, env) {
        const object = (0, interpreter_js_1.Evaluate)(expr.object, env);
        if (object.type === "array") {
          const arrayValue = object;
          if (!expr.computed) {
            throw new errors_js_1.InterpretError("Cannot use dot notation on arrays. Use bracket notation instead.");
          }
          const indexValue = (0, interpreter_js_1.Evaluate)(expr.property, env);
          if (indexValue.type !== "number") {
            throw new errors_js_1.InterpretError(`Array index must be a number, got: ${indexValue.type}`);
          }
          const index = indexValue.value;
          if (index < 0 || index !== Math.floor(index)) {
            throw new errors_js_1.InterpretError(`Invalid array index: ${index}`);
          }
          if (index >= arrayValue.elements.length) {
            return (0, values_js_1.MakeNull)();
          }
          return arrayValue.elements[index];
        }
        if (object.type === "object") {
          const objValue = object;
          let propertyKey;
          if (expr.computed) {
            const keyValue = (0, interpreter_js_1.Evaluate)(expr.property, env);
            if (keyValue.type === "string") {
              propertyKey = keyValue.value;
            } else if (keyValue.type === "number") {
              propertyKey = keyValue.value.toString();
            } else {
              throw new errors_js_1.InterpretError(`Property key must be string or number, got: ${keyValue.type}`);
            }
          } else {
            if (expr.property.kind !== "Identifier") {
              throw new errors_js_1.InterpretError("Non-computed property access requires identifier");
            }
            propertyKey = expr.property.symbol;
          }
          const value = objValue.properties.get(propertyKey);
          return value !== void 0 ? value : (0, values_js_1.MakeNull)();
        }
        throw new errors_js_1.InterpretError(`Cannot access property of ${object.type}`);
      }
    }
  });

  // dist/runtime/interpreter.js
  var require_interpreter = __commonJS({
    "dist/runtime/interpreter.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Evaluate = Evaluate;
      var errors_js_1 = require_errors();
      var statements_js_1 = require_statements();
      var expressions_js_1 = require_expressions();
      function Evaluate(astNode, env) {
        switch (astNode.kind) {
          case "NumericLiteral":
            return {
              type: "number",
              value: astNode.value
            };
          case "StringLiteral":
            return {
              type: "string",
              value: astNode.value
            };
          case "Identifier":
            return (0, expressions_js_1.EvaluateIdentifier)(astNode, env);
          case "ObjectLiteral":
            return (0, expressions_js_1.EvaluateObjectExpression)(astNode, env);
          case "CallExpression":
            return (0, expressions_js_1.EvaluateCallExpression)(astNode, env);
          case "AssignmentExpression":
            return (0, expressions_js_1.EvaluateAssignment)(astNode, env);
          case "BinaryExpression":
            return (0, expressions_js_1.EvaluateBinaryExpression)(astNode, env);
          case "ComparisonExpression":
            return (0, expressions_js_1.EvaluateComparisonExpression)(astNode, env);
          case "Program":
            return (0, statements_js_1.EvaluateProgram)(astNode, env);
          case "VariableDeclaration":
            return (0, statements_js_1.EvaluateVariableDeclaration)(astNode, env);
          case "FunctionDeclaration":
            return (0, statements_js_1.EvaluateFunctionDeclaration)(astNode, env);
          case "ReturnStatement":
            return (0, statements_js_1.EvaluateReturnStatement)(astNode, env);
          case "IfStatement":
            return (0, expressions_js_1.EvaluateIfStatement)(astNode, env);
          case "ForExpression":
            return (0, expressions_js_1.EvaluateForExpression)(astNode, env);
          case "WhileExpression":
            return (0, expressions_js_1.EvaluateWhileExpression)(astNode, env);
          case "ArrayLiteral":
            return (0, expressions_js_1.EvaluateArrayExpression)(astNode, env);
          case "MemberExpression":
            return (0, expressions_js_1.EvaluateMemberExpression)(astNode, env);
          default:
            throw new errors_js_1.InterpretError(`The following AST node has not yet been setup for interpretation: ${astNode.kind}`);
        }
      }
    }
  });

  // dist/compilation/templates.js
  var require_templates = __commonJS({
    "dist/compilation/templates.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.JAVA_TEMPLATES = void 0;
      exports.JAVA_TEMPLATES = {
        main_class: `
import java.util.HashMap;
import java.util.Objects;

public class {{CLASS_NAME}} {
    {{CLASS_VARIABLES}}
    
    public static void main(String[] args) {
        {{CLASS_NAME}} program = new {{CLASS_NAME}}();
        program.run();
    }
    
    public void run() {
        {{MAIN_BODY}}
    }
    
    {{GENERATED_METHODS}}
}
    `.trim(),
        method: `
    public {{RETURN_TYPE}} {{METHOD_NAME}}({{PARAMETERS}}) {
        {{METHOD_BODY}}
    }
    `.trim(),
        variable: `{{MODIFIER}}{{TYPE}} {{NAME}} = {{VALUE}};`,
        for_loop: `
        for (int i = 0; i < {{ITERATIONS}}; i++) {
            {{LOOP_BODY}}
        }
    `.trim(),
        while_loop: `
        while ({{CONDITION}}) {
            {{LOOP_BODY}}
        }
    `.trim(),
        if_statement: `
        if ({{CONDITION}}) {
            {{IF_BODY}}
        }{{ELSE_CLAUSE}}
    `.trim(),
        ternary_if: `{{CONDITION}} ? {{TRUE_EXPR}} : {{FALSE_EXPR}}`,
        print: `System.out.println({{ARGS}});`,
        array: `{{TYPE}}[] {{NAME}} = new {{TYPE}}[{{SIZE}}];`,
        runtime_class: `
    public class Runtime {
        public static Object add(Object a, Object b) {
            if (a instanceof Number && b instanceof Number) {
                if (a instanceof Integer && b instanceof Integer) {
                    return (Integer) a + (Integer) b;
                }
                return ((Number) a).doubleValue() + ((Number) b).doubleValue();
            }
            return String.valueOf(a) + String.valueOf(b);
        }

        public static Object sub(Object a, Object b) {
            if (a instanceof Number && b instanceof Number) {
                if (a instanceof Integer && b instanceof Integer) {
                    return (Integer) a - (Integer) b;
                }
                return ((Number) a).doubleValue() - ((Number) b).doubleValue();
            }
            return "Incompatible types: Cannot subtract strings.";
        }

        public static Object mult(Object a, Object b) {
            if (a instanceof Number && b instanceof Number) {
                if (a instanceof Integer && b instanceof Integer) {
                    return (Integer) a * (Integer) b;
                }
                return ((Number) a).doubleValue() * ((Number) b).doubleValue();
            }
            return "Incompatible types: Cannot multiply strings.";
        }

        public static Object div(Object a, Object b) {
            if (a instanceof Number && b instanceof Number) {
                if (a instanceof Integer && b instanceof Integer) {
                    return (Integer) a / (Integer) b;
                }
                return ((Number) a).doubleValue() / ((Number) b).doubleValue();
            }
            return "Incompatible types: Cannot divide strings.";
        }
    }
`
      };
    }
  });

  // dist/compilation/compiler.js
  var require_compiler = __commonJS({
    "dist/compilation/compiler.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.JavaCompiler = void 0;
      var templates_js_1 = require_templates();
      var JavaCompiler = class {
        /**
         * Compile a program to Java
         */
        compile(program, className = "Program") {
          const context = new CompilationContext(className);
          for (const stmt of program.body) {
            this.compileStatement(stmt, context);
          }
          return `
${this.generateMainClass(context)}
${this.fillTemplate("runtime_class", {})}
`;
        }
        /**
         * Compile a single statement
         */
        compileStatement(stmt, context) {
          switch (stmt.kind) {
            case "FunctionDeclaration":
              this.compileFunctionDeclaration(stmt, context);
              break;
            case "VariableDeclaration":
              this.compileVariableDeclaration(stmt, context);
              break;
            case "IfStatement":
              this.compileIfStatement(stmt, context);
              break;
            case "CallExpression":
            case "AssignmentExpression":
            case "ForExpression":
            case "WhileExpression":
            case "BinaryExpression": {
              const javaCode = this.statementToJava(stmt, context);
              if (javaCode.trim())
                context.addMainStatement(javaCode);
              break;
            }
            default:
              console.warn(`Unsupported statement type: ${stmt.kind}`);
          }
        }
        /**
         * Compile function declarations with unreachable statement detection
         */
        compileFunctionDeclaration(func, context) {
          context.setInMethod(true);
          context.registerFunction(func.name, func.parameters);
          const methodBody = func.body.map((stmt, index) => {
            if (index > 0 && this.isUnreachable(func.body, index))
              return null;
            if (index === func.body.length - 1 && this.isExpression(stmt)) {
              return "        return " + this.expressionToJava(stmt, context) + ";";
            }
            if (stmt.kind === "ReturnStatement") {
              const returnExpr = stmt.value;
              return returnExpr ? "        return " + this.expressionToJava(returnExpr, context) + ";" : "        return null;";
            }
            const stmtCode = this.statementToJava(stmt, context);
            return stmtCode ? "        " + stmtCode : null;
          }).filter(Boolean).join("\n");
          const parameters = func.parameters.map((param) => `Object ${param}`).join(", ");
          const methodCode = this.fillTemplate("method", {
            RETURN_TYPE: "Object",
            METHOD_NAME: func.name,
            PARAMETERS: parameters,
            METHOD_BODY: methodBody || "        return null;"
          });
          context.addMethod(methodCode);
          context.setInMethod(false);
        }
        /**
         * Detect if a statement is unreachable (after a return)
         */
        isUnreachable(body, index) {
          for (let i = 0; i < index; i++) {
            if (body[i].kind === "ReturnStatement")
              return true;
            if (i === body.length - 2 && this.isExpression(body[i]))
              return true;
          }
          return false;
        }
        /**
         * Check if a statement is an expression
         */
        isExpression(stmt) {
          return stmt.kind === "BinaryExpression" || stmt.kind === "CallExpression" || stmt.kind === "NumericLiteral" || stmt.kind === "StringLiteral" || stmt.kind === "Identifier" || stmt.kind === "ComparisonExpression";
        }
        /**
         * Compile variable declarations
         */
        compileVariableDeclaration(varDecl, context) {
          const javaType = varDecl.value ? this.getJavaType(varDecl.value) : "Object";
          const javaValue = varDecl.value ? this.expressionToJava(varDecl.value, context) : "null";
          const modifier = varDecl.constant ? "final " : "";
          const varCode = this.fillTemplate("variable", {
            MODIFIER: modifier,
            TYPE: javaType,
            NAME: varDecl.identifier,
            VALUE: javaValue
          });
          if (context.isInMethod()) {
            context.addMainStatement(varCode);
          } else {
            context.addClassVariable("    private " + varCode);
            context.registerVariable(varDecl.identifier, javaType);
          }
        }
        /**
         * Compile if statements
         */
        compileIfStatement(ifStmt, context) {
          let condition;
          if (ifStmt.condition.kind === "ComparisonExpression") {
            condition = this.expressionToJava(ifStmt.condition, context);
          } else {
            const expr = this.expressionToJava(ifStmt.condition, context);
            condition = this.convertToBoolean(expr);
          }
          const thenBody = ifStmt.thenBranch.map((stmt) => {
            const stmtCode = this.statementToJava(stmt, context);
            return stmtCode ? "            " + stmtCode : null;
          }).filter(Boolean).join("\n");
          let ifCode;
          if (ifStmt.elseBranch && ifStmt.elseBranch.length > 0) {
            const elseBody = ifStmt.elseBranch.map((stmt) => {
              const stmtCode = this.statementToJava(stmt, context);
              return stmtCode ? "            " + stmtCode : null;
            }).filter(Boolean).join("\n");
            ifCode = `if (${condition}) {
${thenBody}
        } else {
${elseBody}
        }`;
          } else {
            ifCode = `if (${condition}) {
${thenBody}
        }`;
          }
          context.addMainStatement(ifCode);
        }
        /**
         * Convert expressions to Java code
         */
        expressionToJava(expr, context) {
          if (!expr)
            return "null";
          switch (expr.kind) {
            case "NumericLiteral":
              return expr.value.toString();
            case "StringLiteral":
              return `"${expr.value.replace(/"/g, '\\"')}"`;
            case "Identifier": {
              const idExpr = expr;
              if (idExpr.symbol === "brewver")
                return '"Brew v2.0"';
              return idExpr.symbol;
            }
            case "BinaryExpression":
              return this.handleBinaryExpression(expr, context);
            case "ComparisonExpression": {
              const compExpr = expr;
              const leftComp = this.expressionToJava(compExpr.left, context);
              const rightComp = this.expressionToJava(compExpr.right, context);
              return this.handleComparison(leftComp, rightComp, compExpr.operator);
            }
            case "CallExpression": {
              const callExpr = expr;
              const args = callExpr.args.map((arg) => this.expressionToJava(arg, context)).join(", ");
              const callerExpr = callExpr.caller;
              if (callerExpr.kind === "Identifier") {
                switch (callerExpr.symbol) {
                  case "int":
                    return `((int)Double.parseDouble(String.valueOf(${args})))`;
                  case "float":
                    return `Double.parseDouble(String.valueOf(${args}))`;
                  case "str":
                    return `String.valueOf(${args})`;
                  case "abs":
                    return `Math.abs(((Number)${args}).doubleValue())`;
                  case "round":
                    return `Math.round(((Number)${args}).doubleValue())`;
                  case "floor":
                    return `Math.floor(((Number)${args}).doubleValue())`;
                  case "ceil":
                    return `Math.ceil(((Number)${args}).doubleValue())`;
                  case "print":
                    return `System.out.println(${args})`;
                  default:
                    return `${callerExpr.symbol}(${args})`;
                }
              }
              const caller = this.expressionToJava(callExpr.caller, context);
              return `${caller}(${args})`;
            }
            case "ObjectLiteral": {
              const objExpr = expr;
              const props = objExpr.properties.map((prop) => `put("${prop.key}", ${prop.value ? this.expressionToJava(prop.value, context) : "null"})`).join("; ");
              return `new HashMap<String, Object>() {{ ${props}; }}`;
            }
            case "ArrayLiteral": {
              const arrExpr = expr;
              const elements = arrExpr.elements.map((el) => this.expressionToJava(el, context));
              return `new java.util.ArrayList<Object>() {{ ${elements.map((el) => `add(${el});`).join(" ")} }}`;
            }
            default:
              return "null";
          }
        }
        /**
         * Handle binary expressions with proper string concatenation detection
         */
        handleBinaryExpression(binExpr, context) {
          console.log(binExpr.left);
          const leftCode = this.expressionToJava(binExpr.left, context);
          const rightCode = this.expressionToJava(binExpr.right, context);
          if (binExpr.operator === "+") {
            if (this.isStringConcatenation(binExpr, context)) {
              console.log("str" + leftCode);
              return `(String.valueOf(${leftCode}) + String.valueOf(${rightCode}))`;
            } else if (this.isNumericExpression(binExpr.left, context) && this.isNumericExpression(binExpr.right, context)) {
              if (this.isIntegerExpression(binExpr.left, context) && this.isIntegerExpression(binExpr.right, context)) {
                return `(int) Runtime.add(${leftCode}, ${rightCode})`;
              }
              return `(double) Runtime.add(${leftCode}, ${rightCode})`;
            } else {
              console.log("else" + leftCode);
              return `(String.valueOf(${leftCode}) + String.valueof(${rightCode}))`;
            }
          }
          if (["-", "*", "/", "%"].includes(binExpr.operator)) {
            if (this.isIntegerExpression(binExpr.left, context) && this.isIntegerExpression(binExpr.right, context) && binExpr.operator !== "/") {
              switch (binExpr.operator) {
                case "-":
                  return `(int) Runtime.sub(${leftCode}, ${rightCode})`;
                case "*":
                  return `(int) Runtime.mult(${leftCode}, ${rightCode})`;
                case "/":
                  return `(int) Runtime.div(${leftCode}, ${rightCode})`;
              }
            } else {
              switch (binExpr.operator) {
                case "-":
                  return `(double) Runtime.sub(${leftCode}, ${rightCode})`;
                case "*":
                  return `(double) Runtime.sub(${leftCode}, ${rightCode})`;
                case "/":
                  return `(double) Runtime.sub(${leftCode}, ${rightCode})`;
              }
            }
          }
          return `(${leftCode} ${binExpr.operator} ${rightCode})`;
        }
        /**
         * Determine if a binary expression should be treated as string concatenation
         */
        isStringConcatenation(binExpr, context) {
          if (binExpr.operator !== "+")
            return false;
          if (this.isStringExpression(binExpr.left, context) || this.isStringExpression(binExpr.right, context)) {
            return true;
          }
          if (binExpr.left.kind === "BinaryExpression" && binExpr.left.operator === "+") {
            return this.isStringConcatenation(binExpr.left, context);
          }
          return false;
        }
        isStringExpression(expr, context) {
          switch (expr.kind) {
            case "StringLiteral":
              return true;
            case "Identifier":
              return context.getVariableType(expr.symbol) === "String";
            // deno-lint-ignore no-case-declarations
            case "CallExpression":
              const call = expr;
              return call.caller.kind === "Identifier" && call.caller.symbol === "str";
            // deno-lint-ignore no-case-declarations
            case "BinaryExpression":
              const binExpr = expr;
              if (binExpr.operator === "+") {
                return this.isStringConcatenation(binExpr, context);
              }
              return false;
            default:
              return false;
          }
        }
        isNumericExpression(expr, context) {
          switch (expr.kind) {
            case "NumericLiteral":
              return true;
            // deno-lint-ignore no-case-declarations
            case "Identifier":
              const type = context.getVariableType(expr.symbol);
              return type === "int" || type === "double";
            // deno-lint-ignore no-case-declarations
            case "CallExpression":
              const call = expr;
              if (call.caller.kind === "Identifier") {
                const funcName = call.caller.symbol;
                return [
                  "int",
                  "float",
                  "abs",
                  "round",
                  "floor",
                  "ceil"
                ].includes(funcName);
              }
              return false;
            // deno-lint-ignore no-case-declarations
            case "BinaryExpression":
              const binExpr = expr;
              return ["-", "*", "/", "%"].includes(binExpr.operator) || binExpr.operator === "+" && !this.isStringConcatenation(binExpr, context);
            default:
              return false;
          }
        }
        isIntegerExpression(expr, context) {
          switch (expr.kind) {
            case "NumericLiteral":
              return Number.isInteger(expr.value);
            case "Identifier":
              return context.getVariableType(expr.symbol) === "int";
            // deno-lint-ignore no-case-declarations
            case "CallExpression":
              const call = expr;
              return call.caller.kind === "Identifier" && call.caller.symbol === "int";
            default:
              return false;
          }
        }
        /**
         * Handle comparison operations
         */
        handleComparison(left, right, operator) {
          switch (operator) {
            case "==":
              return `Objects.equals(${left}, ${right})`;
            case "!=":
              return `!Objects.equals(${left}, ${right})`;
            case ">":
            case "<":
            case ">=":
            case "<=":
              return `(((Number)${left}).doubleValue() ${operator} ((Number)${right}).doubleValue())`;
            default:
              return `(${left} ${operator} ${right})`;
          }
        }
        /**
         * Convert statements to Java code
         */
        statementToJava(stmt, context) {
          switch (stmt.kind) {
            case "AssignmentExpression": {
              const assignExpr = stmt;
              const assignee = this.expressionToJava(assignExpr.assignee, context);
              const value = this.expressionToJava(assignExpr.value, context);
              return `${assignee} = ${value};`;
            }
            case "CallExpression": {
              const callExpr = stmt;
              if (callExpr.caller.kind === "Identifier" && callExpr.caller.symbol === "print") {
                const args = callExpr.args.map((arg) => this.expressionToJava(arg, context)).join(", ");
                return this.fillTemplate("print", { ARGS: args });
              }
              return `${this.expressionToJava(stmt, context)};`;
            }
            case "ForExpression": {
              const forExpr = stmt;
              const iterations = this.expressionToJava(forExpr.amount, context);
              const forBody = forExpr.body.map((s) => {
                const stmtCode = this.statementToJava(s, context);
                return stmtCode ? "            " + stmtCode : null;
              }).filter(Boolean).join("\n");
              return this.fillTemplate("for_loop", {
                ITERATIONS: iterations,
                LOOP_BODY: forBody
              });
            }
            case "WhileExpression": {
              const whileExpr = stmt;
              let condition;
              if (whileExpr.condition.kind === "ComparisonExpression") {
                condition = this.expressionToJava(whileExpr.condition, context);
              } else {
                const expr = this.expressionToJava(whileExpr.condition, context);
                condition = this.convertToBoolean(expr);
              }
              const whileBody = whileExpr.body.map((s) => {
                const stmtCode = this.statementToJava(s, context);
                return stmtCode ? "            " + stmtCode : null;
              }).filter(Boolean).join("\n");
              return this.fillTemplate("while_loop", {
                CONDITION: condition,
                LOOP_BODY: whileBody
              });
            }
            case "BinaryExpression":
              return `${this.expressionToJava(stmt, context)};`;
            case "VariableDeclaration":
              this.compileVariableDeclaration(stmt, context);
              return "";
            case "ReturnStatement": {
              const returnExpr = stmt.expression;
              return returnExpr ? `return ${this.expressionToJava(returnExpr, context)};` : "return null;";
            }
            default:
              return `// Unsupported statement: ${stmt.kind}`;
          }
        }
        convertToBoolean(expr) {
          return `(${expr} != null && !String.valueOf(${expr}).equals("null") && !String.valueOf(${expr}).equals("") && !String.valueOf(${expr}).equals("0") && !String.valueOf(${expr}).equals("false"))`;
        }
        generateMainClass(context) {
          return this.fillTemplate("main_class", {
            CLASS_NAME: context.className,
            CLASS_VARIABLES: context.classVariables.join("\n"),
            MAIN_BODY: context.mainStatements.map((stmt) => "        " + stmt).join("\n"),
            GENERATED_METHODS: context.methods.join("\n\n")
          });
        }
        fillTemplate(templateName, values) {
          let template = templates_js_1.JAVA_TEMPLATES[templateName];
          if (!template)
            throw new Error(`Template '${templateName}' not found`);
          for (const [key, value] of Object.entries(values)) {
            const placeholder = `{{${key}}}`;
            template = template.replace(new RegExp(placeholder, "g"), value);
          }
          return template;
        }
        getJavaType(expr) {
          if (!expr)
            return "Object";
          switch (expr.kind) {
            case "NumericLiteral":
              return Number.isInteger(expr.value) ? "int" : "double";
            case "StringLiteral":
              return "String";
            case "ObjectLiteral":
              return "HashMap<String, Object>";
            case "ArrayLiteral":
              return "java.util.ArrayList<Object>";
            case "CallExpression": {
              const callExpr = expr;
              if (callExpr.caller.kind === "Identifier") {
                const funcName = callExpr.caller.symbol;
                switch (funcName) {
                  case "int":
                    return "int";
                  case "float":
                    return "double";
                  case "str":
                    return "String";
                  default:
                    return "Object";
                }
              }
              return "Object";
            }
            default:
              return "Object";
          }
        }
      };
      exports.JavaCompiler = JavaCompiler;
      var CompilationContext = class {
        constructor(className) {
          this.classVariables = [];
          this.mainStatements = [];
          this.methods = [];
          this.inMethod = false;
          this.variableTypes = /* @__PURE__ */ new Map();
          this.functions = /* @__PURE__ */ new Map();
          this.className = className;
        }
        addClassVariable(variable) {
          this.classVariables.push(variable);
        }
        addMainStatement(statement) {
          this.mainStatements.push(statement);
        }
        addMethod(method) {
          this.methods.push(method);
        }
        isInMethod() {
          return this.inMethod;
        }
        setInMethod(inMethod) {
          this.inMethod = inMethod;
        }
        registerVariable(name, type) {
          this.variableTypes.set(name, type);
        }
        getVariableType(name) {
          return this.variableTypes.get(name) || "Object";
        }
        registerFunction(name, parameters) {
          this.functions.set(name, parameters);
        }
        isFunction(name) {
          return this.functions.has(name);
        }
      };
    }
  });

  // dist/main.js
  var require_main = __commonJS({
    "dist/main.js"(exports) {
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var parser_js_1 = __importDefault(require_parser());
      var interpreter_js_1 = require_interpreter();
      var environment_js_1 = require_environment();
      var compiler_js_1 = require_compiler();
      var compat_js_1 = require_compat();
      var BrewEngine = {
        compile: async function(code, className = "Program") {
          try {
            const parser = new parser_js_1.default();
            const compiler = new compiler_js_1.JavaCompiler();
            const program = parser.ProduceAST(code);
            return compiler.compile(program, className);
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(`${error.name}: ${error.message}`);
            } else {
              throw new Error("Unknown compilation error: " + error);
            }
          }
        },
        interpret: function(code) {
          try {
            const parser = new parser_js_1.default();
            const env = (0, environment_js_1.CreateGlobalEnv)();
            const program = parser.ProduceAST(code);
            const originalLog = console.log;
            let output = "";
            console.log = (...args2) => {
              output += args2.join(" ") + "\n";
            };
            const result = (0, interpreter_js_1.Evaluate)(program, env);
            console.log = originalLog;
            return output || String(result);
          } catch (error) {
            if (error instanceof Error) {
              throw new Error(`${error.name}: ${error.message}`);
            } else {
              throw new Error("Unknown interpretation error: " + error);
            }
          }
        },
        repl: async function() {
          await Repl();
        },
        run: async function(filename) {
          await Run(filename);
        },
        compileFile: async function(filename, className) {
          await Compile(filename, className);
        }
      };
      if (typeof globalThis !== "undefined") {
        globalThis.BrewEngine = BrewEngine;
      }
      var args = compat_js_1.compat.args;
      var isJVM = typeof Java !== "undefined";
      var hasArgs = args && args.length > 0;
      if (!isJVM && (hasArgs || typeof Deno !== "undefined")) {
        if (args.length > 0) {
          if (args[0] === "run") {
            Run(args[1]);
          } else if (args[0] === "compile") {
            Compile(args[1], args[2]);
          } else {
            console.error("Unknown command: " + args[0]);
            compat_js_1.compat.exit(1);
          }
        } else {
          Repl();
        }
      }
      async function Run(filename) {
        const parser = new parser_js_1.default();
        const env = (0, environment_js_1.CreateGlobalEnv)();
        if (!filename.endsWith(".brew")) {
          console.error("Only .brew files are supported.");
          compat_js_1.compat.exit(1);
        }
        try {
          const input = await compat_js_1.compat.readTextFile(filename);
          const program = parser.ProduceAST(input);
          (0, interpreter_js_1.Evaluate)(program, env);
        } catch (error) {
          if (error instanceof Error) {
            console.error(`${error.name}: ${error.message}`);
          } else {
            console.error("Unknown error:", error);
          }
        }
      }
      async function Compile(filename, className) {
        if (!filename.endsWith(".brew")) {
          console.error("Only .brew files are supported.");
          compat_js_1.compat.exit(1);
        }
        try {
          const parser = new parser_js_1.default();
          const compiler = new compiler_js_1.JavaCompiler();
          const brewCode = await compat_js_1.compat.readTextFile(filename);
          const program = parser.ProduceAST(brewCode);
          const finalClassName = className || "Program";
          const javaCode = compiler.compile(program, finalClassName);
          const outputFilename = finalClassName + ".java";
          await compat_js_1.compat.mkdir("./compiled");
          await compat_js_1.compat.writeTextFile("./compiled/" + outputFilename, javaCode);
          console.log(`
Java code written to: ./compiled/${outputFilename}`);
        } catch (error) {
          if (error instanceof Error) {
            console.error(`${error.name}: ${error.message}`);
          } else {
            console.error("Unknown error:", error);
          }
        }
      }
      async function Repl() {
        const parser = new parser_js_1.default();
        const env = (0, environment_js_1.CreateGlobalEnv)();
        console.log("\nBrew Repl 2.3.0");
        console.log("Type 'exit' to quit");
        let readLine;
        if (typeof Deno !== "undefined") {
          readLine = async () => prompt("> ");
        } else if (typeof Java !== "undefined") {
          console.log("REPL not supported in JVM library mode");
          return;
        } else {
          throw new Error("No REPL supported in this environment");
        }
        await universalRepl(parser, env, readLine);
        compat_js_1.compat.exit(0);
      }
      async function universalRepl(parser, env, readLine) {
        while (true) {
          const input = await readLine();
          if (input === null || input.trim() === "exit") {
            console.log("Goodbye!");
            break;
          }
          if (!input.trim())
            continue;
          try {
            const program = parser.ProduceAST(input);
            (0, interpreter_js_1.Evaluate)(program, env);
          } catch (error) {
            if (error instanceof Error)
              console.error(`${error.name}: ${error.message}`);
            else
              console.error("Unknown error:", error);
          }
        }
      }
    }
  });
  require_main();
})();
