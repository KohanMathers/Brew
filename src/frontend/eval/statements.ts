import {
    FunctionDeclaration,
    ImportStatement,
    Program,
    ReturnStatement,
    VariableDeclaration,
} from "../ast.ts";
import Environment from "../../runtime/environment.ts";
import { Evaluate } from "../../runtime/interpreter.ts";
import {
    FunctionValue,
    MakeNull,
    MakeReturn,
    ObjectValue,
    RuntimeValue,
} from "../../runtime/values.ts";
import { compat } from "../../compat.ts";
import { ImportError } from "../errors.ts";
import Parser from "../parser.ts";

/**
 * Evaluates a program
 * Iterates through all statements in the program's body and evaluates them.
 * Returns the result of the last evaluated statement.
 */
export function EvaluateProgram(
    program: Program,
    env: Environment,
): RuntimeValue {
    let lastEvaluated: RuntimeValue = MakeNull();

    // Iterate through the program body and evaluate each statement
    for (const statement of program.body) {
        lastEvaluated = Evaluate(statement, env);
    }

    // Return the result of the last statement evaluated
    return lastEvaluated;
}

/**
 * Evaluates a variable declaration
 * Evaluates the initial value of a variable and declares it in the environment.
 * If no value is provided, the variable is assigned null.
 */
export function EvaluateVariableDeclaration(
    declaration: VariableDeclaration,
    env: Environment,
): RuntimeValue {
    // Evaluate the value if it exists, otherwise assign null
    const value = declaration.value
        ? Evaluate(declaration.value, env)
        : MakeNull();

    // Declare the variable in the environment
    return env.declareVariable(
        declaration.identifier,
        value,
        declaration.constant,
    );
}

/**
 * Evaluates a function declaration
 * Creates a function object and declares it in the given env
 */
export function EvaluateFunctionDeclaration(
    declaration: FunctionDeclaration,
    env: Environment,
): RuntimeValue {
    const func = {
        type: "function",
        name: declaration.name,
        parameters: declaration.parameters,
        declarationEnv: env,
        body: declaration.body,
    } as FunctionValue;

    return env.declareVariable(declaration.name, func, true);
}

/**
 * Evaluates a return statement
 * Returns the value of the return statement, or null if no value is provided.
 */
export function EvaluateReturnStatement(
    statement: ReturnStatement,
    env: Environment,
): RuntimeValue {
    const value = statement.value ? Evaluate(statement.value, env) : MakeNull();
    return MakeReturn(value);
}

/**
 * Evaluates an import statement
 * Reads from ./brew_packages/<package_name>/main.brew and evaluates it in a new environment
 * If the package is not found, throws an error
 */
export function EvaluateImportStatement(
    statement: ImportStatement,
    env: Environment,
): RuntimeValue {
    const importPath = statement.value as string;
    let packagePath: string;
    let packageName: string;
    
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
        packagePath = importPath.endsWith('.brew') ? importPath : `${importPath}.brew`;
        packageName = importPath.split('/').pop()?.replace('.brew', '') || importPath;
    } else {
        packagePath = `./brew_packages/${importPath}/main.brew`;
        packageName = importPath;
    }
    
    try {
        if (!compat.existsSync(packagePath)) {
            const pathType = importPath.startsWith('./') || importPath.startsWith('../') ? 'file' : 'package';
            throw new ImportError(`${pathType === 'file' ? 'File' : 'Package'} '${importPath}' not found. ${pathType === 'package' ? 'Please make sure it is installed.' : 'Please check the file path.'}`);
        }

        const packageSource = compat.readFileSync(packagePath, "utf-8");

        const parser = new Parser();
        const packageAST = parser.ProduceAST(packageSource);

        let globalEnv = env;
        while (globalEnv.parent) {
            globalEnv = globalEnv.parent;
        }

        const packageEnv = new Environment(globalEnv);
        
        let packageExports: RuntimeValue = MakeNull();
        for (const stmt of packageAST.body) {
            packageExports = Evaluate(stmt, packageEnv);
        }

        const packageObject = new Map<string, RuntimeValue>();
        for (const [varName, value] of packageEnv.variables) {
            if (!globalEnv.variables.has(varName)) {
                packageObject.set(varName, value);
            }
        }

        const packageValue: ObjectValue = {
            type: "object",
            properties: packageObject,
        };

        env.declareVariable(packageName, packageValue, false);

        return packageValue;
    } catch (error) {
        if (error instanceof ImportError) {
            throw error;
        } else {
            throw new ImportError(`Failed to import '${importPath}': ${error}`);
        }
    }
}