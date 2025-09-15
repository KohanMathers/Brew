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
    ArrayLiteral,
    MemberExpression,
} from "../frontend/ast.ts";
import { JAVA_TEMPLATES, TemplateKey } from "./templates.ts";

export class JavaCompiler {
    /**
     * Compile a program to Java
     */
    public compile(program: Program, className: string = "Program"): string {
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
                if (javaCode.trim()) context.addMainStatement(javaCode);
                break;
            }
            default:
                console.warn(`Unsupported statement type: ${stmt.kind}`);
        }
    }

    /**
     * Compile function declarations with unreachable statement detection
     */
    private compileFunctionDeclaration(
        func: FunctionDeclaration,
        context: CompilationContext,
    ): void {
        const methodContext = new CompilationContext(context.className);
        methodContext.setInMethod(true);

        context.registerFunction(func.name, func.parameters);

        const methodBody = func.body
            .map((stmt, index) => {
                if (index > 0 && this.isUnreachable(func.body, index))
                    return null;

                if (index === func.body.length - 1 && this.isExpression(stmt)) {
                    return (
                        "        return " +
                        this.expressionToJava(stmt as Expression, context) +
                        ";"
                    );
                }

                if (stmt.kind === "ReturnStatement") {
                    // deno-lint-ignore no-explicit-any
                    const returnExpr = (stmt as any).value;
                    return returnExpr
                        ? "        return " +
                              this.expressionToJava(returnExpr, methodContext) +
                              ";"
                        : "        return null;";
                }

                // Handle variable declarations within the method
                if (stmt.kind === "VariableDeclaration") {
                    const varDecl = stmt as VariableDeclaration;
                    let javaType = varDecl.value
                        ? this.getJavaType(varDecl.value)
                        : "Object";
                    const javaValue = varDecl.value
                        ? this.expressionToJava(varDecl.value, methodContext)
                        : "null";

                    // If the initial value is 0 and it's used in arithmetic contexts treat it as int for better type inference
                    if (
                        varDecl.value?.kind === "NumericLiteral" &&
                        (varDecl.value as NumericLiteral).value === 0
                    ) {
                        javaType = "int";
                    }

                    // Register the variable type in method context
                    methodContext.registerVariable(
                        varDecl.identifier,
                        javaType,
                    );

                    const modifier = varDecl.constant ? "final " : "";
                    return `        ${modifier}${javaType} ${varDecl.identifier} = ${javaValue};`;
                }

                const stmtCode = this.statementToJava(stmt, methodContext);
                return stmtCode ? "        " + stmtCode : null;
            })
            .filter(Boolean)
            .join("\n");

        const parameters = func.parameters
            .map((param) => `Object ${param}`)
            .join(", ");

        const methodCode = this.fillTemplate("method", {
            RETURN_TYPE: "Object",
            METHOD_NAME: func.name,
            PARAMETERS: parameters,
            METHOD_BODY: methodBody || "        return null;",
        });

        context.addMethod(methodCode);
        methodContext.setInMethod(false);
    }

    /**
     * Detect if a statement is unreachable (after a return)
     */
    private isUnreachable(body: Stmt[], index: number): boolean {
        for (let i = 0; i < index; i++) {
            if (body[i].kind === "ReturnStatement") return true;
            // Also check if previous statement is an expression that would be a return
            if (i === body.length - 2 && this.isExpression(body[i]))
                return true;
        }
        return false;
    }

    /**
     * Check if a statement is an expression
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
            if (varDecl.value && this.isSimpleExpression(varDecl.value)) {
                context.addClassVariable("    private " + varCode);
                context.registerVariable(varDecl.identifier, javaType);
            } else {
                context.addClassVariable(
                    `    private ${javaType} ${varDecl.identifier};`,
                );
                context.addMainStatement(
                    `${varDecl.identifier} = ${javaValue};`,
                );
                context.registerVariable(varDecl.identifier, javaType);
            }
        }
    }

    /**
     * Determine if an expression is simple (literal or identifier)
     */
    private isSimpleExpression(expr: Expression): boolean {
        if (!expr) return true;
        return (
            expr.kind === "NumericLiteral" ||
            expr.kind === "StringLiteral" ||
            expr.kind === "Identifier" ||
            (expr.kind === "ObjectLiteral" &&
                (expr as ObjectLiteral).properties.length === 0) ||
            (expr.kind === "ArrayLiteral" &&
                (expr as ArrayLiteral).elements.every((e) =>
                    this.isSimpleExpression(e),
                ))
        );
    }

    /**
     * Compile if statements
     */
    private compileIfStatement(
        ifStmt: IfStatement,
        context: CompilationContext,
    ): void {
        let condition: string;

        if (ifStmt.condition.kind === "ComparisonExpression") {
            condition = this.expressionToJava(ifStmt.condition, context);
        } else {
            const expr = this.expressionToJava(ifStmt.condition, context);
            condition = this.convertToBoolean(expr);
        }

        const thenBody = ifStmt.thenBranch
            .map((stmt) => {
                const stmtCode = this.statementToJava(stmt, context);
                return stmtCode ? "            " + stmtCode : null;
            })
            .filter(Boolean)
            .join("\n");

        let ifCode: string;
        if (ifStmt.elseBranch && ifStmt.elseBranch.length > 0) {
            const elseBody = ifStmt.elseBranch
                .map((stmt) => {
                    const stmtCode = this.statementToJava(stmt, context);
                    return stmtCode ? "            " + stmtCode : null;
                })
                .filter(Boolean)
                .join("\n");
            ifCode = `if (${condition}) {\n${thenBody}\n        } else {\n${elseBody}\n        }`;
        } else {
            ifCode = `if (${condition}) {\n${thenBody}\n        }`;
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
            case "NumericLiteral":
                return (expr as NumericLiteral).value.toString();
            case "StringLiteral":
                return `"${(expr as StringLiteral).value.replace(/"/g, '\\"')}"`;
            case "Identifier": {
                const idExpr = expr as Identifier;
                if (idExpr.symbol === "brewver") return '"Brew v2.0"';
                return idExpr.symbol;
            }
            case "BinaryExpression":
                return this.handleBinaryExpression(
                    expr as BinaryExpression,
                    context,
                );
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
                    .map((arg) => this.expressionToJava(arg, context))
                    .join(", ");
                const callerExpr = callExpr.caller as Identifier;

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
                            // User-defined function call
                            return `${callerExpr.symbol}(${args})`;
                    }
                }

                const caller = this.expressionToJava(callExpr.caller, context);
                return `${caller}(${args})`;
            }
            case "ObjectLiteral": {
                const objExpr = expr as ObjectLiteral;
                const props = objExpr.properties
                    .map(
                        (prop: Property) =>
                            `put("${prop.key}", ${prop.value ? this.expressionToJava(prop.value, context) : "null"})`,
                    )
                    .join("; ");
                return `new HashMap<String, Object>() {{ ${props}; }}`;
            }
            case "ArrayLiteral": {
                const arrExpr = expr as ArrayLiteral;
                const elements: string[] = arrExpr.elements.map((el) =>
                    this.expressionToJava(el, context),
                );
                return `new java.util.ArrayList<Object>() {{ ${elements.map((el) => `add(${el});`).join(" ")} }}`;
            }
            case "MemberExpression": {
                const memberExpr = expr as MemberExpression;
                const object = this.expressionToJava(
                    memberExpr.object,
                    context,
                );

                if (memberExpr.computed) {
                    const property = this.expressionToJava(
                        memberExpr.property,
                        context,
                    );
                    return `((java.util.ArrayList<Object>)${object}).get((int)${property})`;
                } else {
                    const propertyName = (memberExpr.property as Identifier)
                        .symbol;
                    return `((HashMap<String, Object>)${object}).get("${propertyName}")`;
                }
            }
            default:
                return "null";
        }
    }

    /**
     * Handle binary expressions with proper string concatenation detection
     */
    private handleBinaryExpression(
        binExpr: BinaryExpression,
        context: CompilationContext,
    ): string {
        const leftCode = this.expressionToJava(binExpr.left, context);
        const rightCode = this.expressionToJava(binExpr.right, context);

        if (binExpr.operator === "+") {
            // Check if this is string concatenation
            if (this.isStringConcatenation(binExpr, context)) {
                return `(String.valueOf(${leftCode}) + String.valueOf(${rightCode}))`;
            }
            // Pure numeric addition
            else if (
                this.isNumericExpression(binExpr.left, context) &&
                this.isNumericExpression(binExpr.right, context)
            ) {
                if (
                    this.isIntegerExpression(binExpr.left, context) &&
                    this.isIntegerExpression(binExpr.right, context)
                ) {
                    return `(int) Runtime.add(${leftCode}, ${rightCode})`;
                }
                return `(double) Runtime.add(${leftCode}, ${rightCode})`;
            }
            // Mixed or unknown types - default to runtime class
            else {
                return `(String.valueOf(${leftCode}) + String.valueOf(${rightCode}))`;
            }
        }

        // Numeric operations for non-plus operators
        if (["-", "*", "/", "%"].includes(binExpr.operator)) {
            if (
                this.isIntegerExpression(binExpr.left, context) &&
                this.isIntegerExpression(binExpr.right, context) &&
                binExpr.operator !== "/"
            ) {
                switch (binExpr.operator) {
                    case "-":
                        return `(int) Runtime.sub(${leftCode}, ${rightCode})`;
                    case "*":
                        return `(int) Runtime.mult(${leftCode}, ${rightCode})`;
                }
            } else {
                switch (binExpr.operator) {
                    case "-":
                        return `(double) Runtime.sub(${leftCode}, ${rightCode})`;
                    case "*":
                        return `(double) Runtime.mult(${leftCode}, ${rightCode})`;
                    case "/":
                        return `(double) Runtime.div(${leftCode}, ${rightCode})`;
                }
            }
        }

        // Fallback for anything else
        return `(${leftCode} ${binExpr.operator} ${rightCode})`;
    }

    /**
     * Determine if a binary expression should be treated as string concatenation
     */
    private isStringConcatenation(
        binExpr: BinaryExpression,
        context: CompilationContext,
    ): boolean {
        if (binExpr.operator !== "+") return false;

        // If either operand is explicitly a string, treat as concatenation
        if (
            this.isStringExpression(binExpr.left, context) ||
            this.isStringExpression(binExpr.right, context)
        ) {
            return true;
        }

        // If left side is a concatenation chain, continue as string
        if (
            binExpr.left.kind === "BinaryExpression" &&
            (binExpr.left as BinaryExpression).operator === "+"
        ) {
            return this.isStringConcatenation(
                binExpr.left as BinaryExpression,
                context,
            );
        }

        return false;
    }

    private isStringExpression(
        expr: Expression,
        context: CompilationContext,
    ): boolean {
        switch (expr.kind) {
            case "StringLiteral":
                return true;
            case "Identifier":
                return (
                    context.getVariableType((expr as Identifier).symbol) ===
                    "String"
                );
            // deno-lint-ignore no-case-declarations
            case "CallExpression":
                const call = expr as CallExpression;
                return (
                    call.caller.kind === "Identifier" &&
                    (call.caller as Identifier).symbol === "str"
                );
            // deno-lint-ignore no-case-declarations
            case "BinaryExpression":
                const binExpr = expr as BinaryExpression;
                if (binExpr.operator === "+") {
                    return this.isStringConcatenation(binExpr, context);
                }
                return false;
            default:
                return false;
        }
    }

    private isNumericExpression(
        expr: Expression,
        context: CompilationContext,
    ): boolean {
        switch (expr.kind) {
            case "NumericLiteral":
                return true;
            // deno-lint-ignore no-case-declarations
            case "Identifier":
                const type = context.getVariableType(
                    (expr as Identifier).symbol,
                );
                return type === "int" || type === "double";
            // deno-lint-ignore no-case-declarations
            case "CallExpression":
                const call = expr as CallExpression;
                if (call.caller.kind === "Identifier") {
                    const funcName = (call.caller as Identifier).symbol;
                    return [
                        "int",
                        "float",
                        "abs",
                        "round",
                        "floor",
                        "ceil",
                    ].includes(funcName);
                }
                return false;
            // deno-lint-ignore no-case-declarations
            case "BinaryExpression":
                const binExpr = expr as BinaryExpression;
                return (
                    ["-", "*", "/", "%"].includes(binExpr.operator) ||
                    (binExpr.operator === "+" &&
                        !this.isStringConcatenation(binExpr, context))
                );
            case "MemberExpression":
                return (expr as MemberExpression).computed;
            default:
                return false;
        }
    }

    private isIntegerExpression(
        expr: Expression,
        context: CompilationContext,
    ): boolean {
        switch (expr.kind) {
            case "NumericLiteral":
                return Number.isInteger((expr as NumericLiteral).value);
            case "Identifier":
                return (
                    context.getVariableType((expr as Identifier).symbol) ===
                    "int"
                );
            // deno-lint-ignore no-case-declarations
            case "CallExpression":
                const call = expr as CallExpression;
                return (
                    call.caller.kind === "Identifier" &&
                    (call.caller as Identifier).symbol === "int"
                );
            default:
                return false;
        }
    }

    /**
     * Handle comparison operations
     */
    private handleComparison(
        left: string,
        right: string,
        operator: string,
    ): string {
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
    private statementToJava(stmt: Stmt, context: CompilationContext): string {
        switch (stmt.kind) {
            case "AssignmentExpression": {
                const assignExpr = stmt as AssignmentExpression;
                const assignee = this.expressionToJava(
                    assignExpr.assignee,
                    context,
                );

                // Check if this is numeric assignment
                if (assignExpr.value.kind === "BinaryExpression") {
                    const binExpr = assignExpr.value as BinaryExpression;
                    if (
                        binExpr.operator === "+" &&
                        !this.isStringConcatenation(binExpr, context)
                    ) {
                        const left = this.expressionToJava(
                            binExpr.left,
                            context,
                        );
                        const right = this.expressionToJava(
                            binExpr.right,
                            context,
                        );
                        return `${assignee} = ((Number)${left}).intValue() + ((Number)${right}).intValue();`;
                    }
                }

                const value = this.expressionToJava(assignExpr.value, context);
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
                        .join(", ");
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
                    .map((s: Stmt) => {
                        const stmtCode = this.statementToJava(s, context);
                        return stmtCode ? "            " + stmtCode : null;
                    })
                    .filter(Boolean)
                    .join("\n");
                return this.fillTemplate("for_loop", {
                    ITERATIONS: iterations,
                    LOOP_BODY: forBody,
                });
            }
            case "WhileExpression": {
                const whileExpr = stmt as WhileExpression;
                let condition: string;
                if (whileExpr.condition.kind === "ComparisonExpression") {
                    condition = this.expressionToJava(
                        whileExpr.condition,
                        context,
                    );
                } else {
                    const expr = this.expressionToJava(
                        whileExpr.condition,
                        context,
                    );
                    condition = this.convertToBoolean(expr);
                }

                const whileBody = whileExpr.body
                    .map((s: Stmt) => {
                        const stmtCode = this.statementToJava(s, context);
                        return stmtCode ? "            " + stmtCode : null;
                    })
                    .filter(Boolean)
                    .join("\n");
                return this.fillTemplate("while_loop", {
                    CONDITION: condition,
                    LOOP_BODY: whileBody,
                });
            }
            case "BinaryExpression":
                return `${this.expressionToJava(stmt as Expression, context)};`;
            case "VariableDeclaration":
                this.compileVariableDeclaration(
                    stmt as VariableDeclaration,
                    context,
                );
                return "";
            case "ReturnStatement": {
                // deno-lint-ignore no-explicit-any
                const returnExpr = (stmt as any).expression;
                return returnExpr
                    ? `return ${this.expressionToJava(returnExpr, context)};`
                    : "return null;";
            }
            default:
                return `// Unsupported statement: ${stmt.kind}`;
        }
    }

    private convertToBoolean(expr: string): string {
        return `(${expr} != null && !String.valueOf(${expr}).equals("null") && !String.valueOf(${expr}).equals("") && !String.valueOf(${expr}).equals("0") && !String.valueOf(${expr}).equals("false"))`;
    }

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

    private fillTemplate(
        templateName: TemplateKey,
        values: Record<string, string>,
    ): string {
        let template = JAVA_TEMPLATES[templateName];
        if (!template) throw new Error(`Template '${templateName}' not found`);

        for (const [key, value] of Object.entries(values)) {
            const placeholder = `{{${key}}}`;
            template = template.replace(new RegExp(placeholder, "g"), value);
        }

        return template;
    }

    private getJavaType(expr: Expression): string {
        if (!expr) return "Object";

        switch (expr.kind) {
            case "NumericLiteral":
                return Number.isInteger((expr as NumericLiteral).value)
                    ? "int"
                    : "double";
            case "StringLiteral":
                return "String";
            case "ObjectLiteral":
                return "HashMap<String, Object>";
            case "ArrayLiteral":
                return "java.util.ArrayList<Object>";
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

class CompilationContext {
    public className: string;
    public classVariables: string[] = [];
    public mainStatements: string[] = [];
    public methods: string[] = [];
    private inMethod: boolean = false;
    private variableTypes: Map<string, string> = new Map();
    private functions: Map<string, string[]> = new Map();

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

    registerVariable(name: string, type: string): void {
        this.variableTypes.set(name, type);
    }

    getVariableType(name: string): string {
        return this.variableTypes.get(name) || "Object";
    }

    registerFunction(name: string, parameters: string[]): void {
        this.functions.set(name, parameters);
    }

    isFunction(name: string): boolean {
        return this.functions.has(name);
    }
}
