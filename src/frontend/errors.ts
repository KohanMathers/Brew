/**
 * Custom error class that captures stack trace properly
 */
class CustomError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Thrown during the parsing phase
 */
export class ParseError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown during the interpretation phase
 */
export class InterpretError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when there's an issue with calculation operations
 */
export class CalculationError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when there's an issue with comparison operations
 */
export class ComparisonError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when a variable declaration fails
 */
export class DeclarationError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when there's an issue resolving a variable
 */
export class ResolutionError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when a variable assignment fails
 */
export class AssignmentError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when a function call fails
 */
export class FunctionError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when an import fails
 */
export class ImportError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Thrown when an install fails
 */
export class InstallError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}
