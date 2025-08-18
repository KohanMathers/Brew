import {
    Program,
    FunctionDeclaration,
    VariableDeclaration,
    Stmt,
    Expression,
    NumericLiteral,
    StringLiteral,
    Identifier,
    BinaryExpression,
    ComparisonExpression,
    CallExpression,
    ObjectLiteral,
    Property,
    AssignmentExpression,
    IfStatement,
    ForExpression,
    WhileExpression,
} from "../frontend/ast.ts";
import { JAVA_TEMPLATES, TemplateKey } from "./templates.ts";

export class JavaCompiler {
    /**
     * Compile a program to Java
     */
    public compile(program: Program, className: string = "Program"): string {
        const context = new CompilationContext(className);

        // Process all statements
        for (const stmt of program.body) {
            this.compileStatement(stmt, context);
        }

        // Generate the main Java class
        return this.generateMainClass(context);
    }

    /**
     * Compile a single statement
     */
    private compileStatement(stmt: Stmt, context: CompilationContext): void {
        switch (stmt.kind) {
            case "FunctionDeclaration":
                this.compileFunctionDeclaration(
                    stmt as FunctionDeclaration,
                    context,
                );
                break;
            case "VariableDeclaration":
                this.compileVariableDeclaration(
                    stmt as VariableDeclaration,
                    context,
                );
                break;
            case "IfStatement":
                this.compileIfStatement(stmt as IfStatement, context);
                break;
            case "CallExpression":
            case "AssignmentExpression":
            case "ForExpression":
            case "WhileExpression":
            case "BinaryExpression": {
                const javaCode = this.statementToJava(stmt, context);
                if (javaCode.trim()) {
                    context.addMainStatement(javaCode);
                }
                break;
            }
            default:
                console.warn(`Unsupported statement type: ${stmt.kind}`);
        }
    }

    /**
     * Compile function declarations
     */
    private compileFunctionDeclaration(
        func: FunctionDeclaration,
        context: CompilationContext,
    ): void {
        // Set context to indicate we're inside a method
        context.setInMethod(true);

        const methodBody = func.body
            .map((stmt, index) => {
                // If it's the last statement and it's an expression, make it a return statement (would have been easier to make 'return' a brew keyword, but oh well)
                if (index === func.body.length - 1 && this.isExpression(stmt)) {
                    return (
                        "        return " +
                        this.expressionToJava(stmt as Expression, context) +
                        ";"
                    );
                }
                return "        " + this.statementToJava(stmt, context);
            })
            .join("\n");

        const parameters = func.parameters
            .map((param) => `Object ${param}`)
            .join(", ");

        const methodCode = this.fillTemplate("method", {
            RETURN_TYPE: "Object",
            METHOD_NAME: func.name,
            PARAMETERS: parameters,
            METHOD_BODY: methodBody,
        });

        context.addMethod(methodCode);
        context.setInMethod(false);
    }

    /**
     * Check if a statement is an expression that can be returned
     */
    private isExpression(stmt: Stmt): boolean {
        return (
            stmt.kind === "BinaryExpression" ||
            stmt.kind === "CallExpression" ||
            stmt.kind === "NumericLiteral" ||
            stmt.kind === "StringLiteral" ||
            stmt.kind === "Identifier" ||
            stmt.kind === "ComparisonExpression"
        );
    }

    /**
     * Compile variable declarations
     */
    private compileVariableDeclaration(
        varDecl: VariableDeclaration,
        context: CompilationContext,
    ): void {
        const javaType = varDecl.value
            ? this.getJavaType(varDecl.value)
            : "Object";
        const javaValue = varDecl.value
            ? this.expressionToJava(varDecl.value, context)
            : "null";

        const modifier = varDecl.constant ? "final " : "";
        const varCode = this.fillTemplate("variable", {
            MODIFIER: modifier,
            TYPE: javaType,
            NAME: varDecl.identifier,
            VALUE: javaValue,
        });

        if (context.isInMethod()) {
            context.addMainStatement(varCode);
        } else {
            context.addClassVariable("    private " + varCode);
        }
    }

    /**
     * Compile if statements
     */
    private compileIfStatement(
        ifStmt: IfStatement,
        context: CompilationContext,
    ): void {
        let condition: string;

        // Check if the condition is a comparison expression that returns boolean
        if (ifStmt.condition.kind === "ComparisonExpression") {
            condition = this.expressionToJava(ifStmt.condition, context);
        } else {
            // For other expressions, convert to boolean
            const expr = this.expressionToJava(ifStmt.condition, context);
            condition = this.convertToBoolean(expr);
        }

        const thenBody = ifStmt.thenBranch
            .map((stmt) => "            " + this.statementToJava(stmt, context))
            .join("\n");

        let ifCode: string;
        if (ifStmt.elseBranch && ifStmt.elseBranch.length > 0) {
            const elseBody = ifStmt.elseBranch
                .map(
                    (stmt) =>
                        "            " + this.statementToJava(stmt, context),
                )
                .join("\n");

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
    private expressionToJava(
        expr: Expression,
        context: CompilationContext,
    ): string {
        if (!expr) return "null";

        switch (expr.kind) {
            case "NumericLiteral": {
                const numExpr = expr as NumericLiteral;
                return numExpr.value.toString();
            }
            case "StringLiteral": {
                const strExpr = expr as StringLiteral;
                return `"${strExpr.value.replace(/"/g, '\\"')}"`;
            }
            case "Identifier": {
                const idExpr = expr as Identifier;
                if (idExpr.symbol === "brewver") {
                    return '"Brew v2.0"';
                }
                return idExpr.symbol;
            }
            case "BinaryExpression": {
                const binExpr = expr as BinaryExpression;
                return this.handleBinaryExpression(binExpr, context);
            }
            case "ComparisonExpression": {
                const compExpr = expr as ComparisonExpression;
                const leftComp = this.expressionToJava(compExpr.left, context);
                const rightComp = this.expressionToJava(
                    compExpr.right,
                    context,
                );
                return this.handleComparison(
                    leftComp,
                    rightComp,
                    compExpr.operator,
                );
            }
            case "CallExpression": {
                const callExpr = expr as CallExpression;
                const args = callExpr.args
                    .map((arg: Expression) =>
                        this.expressionToJava(arg, context),
                    )
                    .join(", ");
                const callerExpr = callExpr.caller as Identifier;

                // Handle built-in functions
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
                            // This should be handled in statementToJava, but just in case
                            return `System.out.println(${args})`;
                        default:
                            return `${callerExpr.symbol}(${args})`;
                    }
                }

                const caller = this.expressionToJava(callExpr.caller, context);
                return `${caller}(${args})`;
            }
            case "ObjectLiteral": {
                const objExpr = expr as ObjectLiteral;
                // Let's be simple people, a HashMap will do
                const props = objExpr.properties
                    .map(
                        (prop: Property) =>
                            `put("${prop.key}", ${prop.value ? this.expressionToJava(prop.value, context) : "null"})`,
                    )
                    .join("; ");
                return `new HashMap<String, Object>() {{ ${props}; }}`;
            }
            default:
                return "null";
        }
    }

    /**
     * Handle binary expressions with proper type casting
     */
    private handleBinaryExpression(
        binExpr: BinaryExpression,
        context: CompilationContext,
    ): string {
        const left = this.expressionToJava(binExpr.left, context);
        const right = this.expressionToJava(binExpr.right, context);

        // Check if the operator is "+" and determine the types of operands
        if (binExpr.operator === "+") {
            // If both operands are numeric, perform numeric addition
            if (this.isNumeric(left) && this.isNumeric(right)) {
                return `(${left} + ${right})`;
            } else if (this.isNumeric(left) || this.isNumeric(right)) {
                return `(${left} + ${right})`;
            }

            // Otherwise, perform string concatenation
            return `(String.valueOf(${left}) + String.valueOf(${right}))`;
        }

        // For other operators, cast to double for numeric operations
        switch (binExpr.operator) {
            case "-":
            case "*":
            case "/":
            case "%":
                return `(((Number)${left}).doubleValue() ${binExpr.operator} ((Number)${right}).doubleValue())`;
            default:
                return `(${left} ${binExpr.operator} ${right})`;
        }
    }

    /**
     * Handle comparison operations with proper type casting
     */
    private handleComparison(
        left: string,
        right: string,
        operator: string,
    ): string {
        switch (operator) {
            case "==":
            case "!=": {
                const equals = `Objects.equals(${left}, ${right})`;
                return operator === "==" ? equals : `!${equals}`;
            }
            case ">":
            case "<":
            case ">=":
            case "<=":
                // For numeric comparisons, cast to double
                return `(((Number)${left}).doubleValue() ${operator} ((Number)${right}).doubleValue())`;
            default:
                return `(${left} ${operator} ${right})`;
        }
    }

    /**
     * Convert statements to Java code
     */
    private statementToJava(stmt: Stmt, context: CompilationContext): string {
        switch (stmt.kind) {
            case "AssignmentExpression": {
                const assignExpr = stmt as AssignmentExpression;
                const assignee = this.expressionToJava(
                    assignExpr.assignee,
                    context,
                );
                const value = this.expressionToJava(assignExpr.value, context);

                // Check if the assignment involves a BinaryExpression with "+"
                if (
                    assignExpr.value.kind === "BinaryExpression" &&
                    (assignExpr.value as BinaryExpression).operator === "+"
                ) {
                    const binaryExpr = assignExpr.value as BinaryExpression;
                    const left = this.expressionToJava(
                        binaryExpr.left,
                        context,
                    );
                    const right = this.expressionToJava(
                        binaryExpr.right,
                        context,
                    );

                    // Use integer arithmetic if both sides are numeric
                    if (this.isNumeric(left) && this.isNumeric(right)) {
                        return `${assignee} = ${left} + ${right};`;
                    }
                }

                return `${assignee} = ${value};`;
            }
            case "CallExpression": {
                const callExpr = stmt as CallExpression;
                if (
                    callExpr.caller.kind === "Identifier" &&
                    (callExpr.caller as Identifier).symbol === "print"
                ) {
                    const args = callExpr.args
                        .map((arg: Expression) =>
                            this.expressionToJava(arg, context),
                        )
                        .join(' + " " + ');
                    return this.fillTemplate("print", { ARGS: args });
                }

                return `${this.expressionToJava(stmt as Expression, context)};`;
            }
            case "ForExpression": {
                const forExpr = stmt as ForExpression;
                const iterations = this.expressionToJava(
                    forExpr.amount,
                    context,
                );
                const forBody = forExpr.body
                    .map(
                        (s: Stmt) =>
                            "            " + this.statementToJava(s, context),
                    )
                    .join("\n");
                return this.fillTemplate("for_loop", {
                    ITERATIONS: iterations,
                    LOOP_BODY: forBody,
                });
            }
            case "WhileExpression": {
                const whileExpr = stmt as WhileExpression;
                const condition = this.expressionToJava(
                    whileExpr.condition,
                    context,
                );
                const whileBody = whileExpr.body
                    .map(
                        (s: Stmt) =>
                            "            " + this.statementToJava(s, context),
                    )
                    .join("\n");
                return this.fillTemplate("while_loop", {
                    CONDITION: condition,
                    LOOP_BODY: whileBody,
                });
            }
            case "BinaryExpression":
                // Handle standalone binary expressions (like a + 5;)
                return `${this.expressionToJava(stmt as Expression, context)};`;

            case "VariableDeclaration":
                this.compileVariableDeclaration(
                    stmt as VariableDeclaration,
                    context,
                );
                return ""; // Already handled in compileVariableDeclaration so just return a blank

            default:
                return `// Unsupported statement: ${stmt.kind}`;
        }
    }

    /**
     * Helper method to check if a value is numeric
     */
    private isNumeric(value: string): boolean {
        return /^-?\d+(\.\d+)?$/.test(value);
    }

    /**
     * Convert expression to boolean for conditions (for non-comparison expressions)
     */
    private convertToBoolean(expr: string): string {
        return `(${expr} != null && !String.valueOf(${expr}).equals("null") && !String.valueOf(${expr}).equals("") && !String.valueOf(${expr}).equals("0") && !String.valueOf(${expr}).equals("false"))`;
    }

    /**
     * Generate the final Java class
     */
    private generateMainClass(context: CompilationContext): string {
        return this.fillTemplate("main_class", {
            CLASS_NAME: context.className,
            CLASS_VARIABLES: context.classVariables.join("\n"),
            MAIN_BODY: context.mainStatements
                .map((stmt) => "        " + stmt)
                .join("\n"),
            GENERATED_METHODS: context.methods.join("\n\n"),
        });
    }

    /**
     * Fill a template with provided values
     */
    private fillTemplate(
        templateName: TemplateKey,
        values: Record<string, string>,
    ): string {
        let template = JAVA_TEMPLATES[templateName];
        if (!template) {
            throw new Error(`Template '${templateName}' not found`);
        }

        // Replace all placeholders
        for (const [key, value] of Object.entries(values)) {
            const placeholder = `{{${key}}}`;
            template = template.replace(new RegExp(placeholder, "g"), value);
        }

        return template;
    }

    /**
     * Determine Java type from Brew expression
     */
    private getJavaType(expr: Expression): string {
        if (!expr) return "Object";

        switch (expr.kind) {
            case "NumericLiteral": {
                const numExpr = expr as NumericLiteral;
                return Number.isInteger(numExpr.value) ? "int" : "double";
            }
            case "StringLiteral":
                return "String";
            case "ObjectLiteral":
                return "HashMap<String, Object>";
            case "CallExpression": {
                const callExpr = expr as CallExpression;
                if (callExpr.caller.kind === "Identifier") {
                    const funcName = (callExpr.caller as Identifier).symbol;
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
}

/**
 * Context class to track compilation state
 */
class CompilationContext {
    public className: string;
    public classVariables: string[] = [];
    public mainStatements: string[] = [];
    public methods: string[] = [];
    private inMethod: boolean = false;

    constructor(className: string) {
        this.className = className;
    }

    addClassVariable(variable: string): void {
        this.classVariables.push(variable);
    }

    addMainStatement(statement: string): void {
        this.mainStatements.push(statement);
    }

    addMethod(method: string): void {
        this.methods.push(method);
    }

    isInMethod(): boolean {
        return this.inMethod;
    }

    setInMethod(inMethod: boolean): void {
        this.inMethod = inMethod;
    }
}
