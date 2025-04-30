export class ParseError extends Error {
    constructor(message: string) {
        super(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ParseError);
        }
    }
}
