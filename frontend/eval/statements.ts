import { Program, VariableDeclaration } from "../ast.ts";
import Environment from "../../runtime/environment.ts";
import { Evaluate } from "../../runtime/interpreter.ts";
import { MakeNull, RuntimeValue } from "../../runtime/values.ts";

export function EvaluateProgram(
    program: Program,
    env: Environment,
): RuntimeValue {
    let lastEvaluated: RuntimeValue = MakeNull();

    for (const statement of program.body) {
        lastEvaluated = Evaluate(statement, env);
    }

    return lastEvaluated;
}

export function EvaluateVariableDeclaration(
    declaration: VariableDeclaration,
    env: Environment,
): RuntimeValue {
    const value = declaration.value
        ? Evaluate(declaration.value, env)
        : MakeNull();
    return env.declareVariable(declaration.identifier, value);
}
