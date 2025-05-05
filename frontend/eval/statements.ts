import { FunctionDeclaration, Program, VariableDeclaration } from "../ast.ts";
import Environment from "../../runtime/environment.ts";
import { Evaluate } from "../../runtime/interpreter.ts";
import { FunctionValue, MakeNull, RuntimeValue } from "../../runtime/values.ts";

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
