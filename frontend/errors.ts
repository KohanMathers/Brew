class CustomError extends Error {
    constructor(message: string) {
        super(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }
        this.name = this.constructor.name;
    }
}

export class ParseError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

export class InterpretError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}

export class CalculationError extends CustomError {
    constructor(message: string) {
        super(message);
    }
}