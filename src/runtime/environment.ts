import {
    DeclarationError,
    ResolutionError,
    AssignmentError,
} from "../frontend/errors.ts";

import {
    MakeBool,
    MakeInternalCall,
    MakeNull,
    MakeString,
    RuntimeValue,
} from "./values.ts";

import {
    TimeFunction,
    PrintFunction,
    NatFunction,
    IntFunction,
    FloatFunction,
    StringFunction,
    CeilFunction,
    AbsFunction,
    FloorFunction,
    RoundFunction,
} from "./functions.ts";

/**
 * Sets up the base env with null/true/false preloaded
 */
export function CreateGlobalEnv() {
    const env = new Environment();

    const globals: [string, RuntimeValue][] = [
        ["null", MakeNull()],
        ["undefined", MakeNull()],
        ["true", MakeBool(true)],
        ["false", MakeBool(false)],
        ["brewver", MakeString("Brew vBrew")],
        ["print", MakeInternalCall(PrintFunction)],
        ["time", MakeInternalCall(TimeFunction)],
        ["nat", MakeInternalCall(NatFunction)],
        ["int", MakeInternalCall(IntFunction)],
        ["float", MakeInternalCall(FloatFunction)],
        ["str", MakeInternalCall(StringFunction)],
        ["abs", MakeInternalCall(AbsFunction)],
        ["round", MakeInternalCall(RoundFunction)],
        ["floor", MakeInternalCall(FloorFunction)],
        ["ceil", MakeInternalCall(CeilFunction)],
    ];

    for (const [name, value] of globals) {
        env.declareVariable(name, value, true);
    }

    return env;
}

/**
 * Env class – handles vars, scopes, all that
 */
export default class Environment {
    private parent?: Environment;
    private variables: Map<string, RuntimeValue>;
    private constants: Set<string>;

    constructor(parentEnv?: Environment) {
        this.parent = parentEnv;
        this.variables = new Map();
        this.constants = new Set();
    }

    /**
     * Makes a new variable in this scope
     */
    public declareVariable(
        varname: string,
        value: RuntimeValue,
        constant: boolean,
    ): RuntimeValue {
        if (this.variables.has(varname)) {
            throw new DeclarationError(
                `Cannot declare variable ${varname}: Already declared.`,
            );
        }

        this.variables.set(varname, value);

        if (constant) this.constants.add(varname);
        return value;
    }

    /**
     * Updates the value of an existing (non-const) var
     */
    public assignVariable(varname: string, value: RuntimeValue): RuntimeValue {
        const env = this.resolve(varname);
        if (env.constants.has(varname)) {
            throw new AssignmentError(
                `Cannot assign to variable '${varname}': Is constant.`,
            );
        }
        env.variables.set(varname, value);
        return value;
    }

    /**
     * Gets the value of a var, looking through scopes if needed
     */
    public lookupVariable(varname: string): RuntimeValue {
        const env = this.resolve(varname);
        return env.variables.get(varname) as RuntimeValue;
    }

    /**
     * Figures out where the var actually lives
     */
    public resolve(varname: string): Environment {
        if (this.variables.has(varname)) return this;

        if (this.parent == undefined)
            throw new ResolutionError(
                `Cannot resolve '${varname}': Does not exist.`,
            );

        return this.parent.resolve(varname);
    }
}
