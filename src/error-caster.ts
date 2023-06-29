export function errorCaster(e: unknown): Error {
    if (e instanceof Error) {
        return e;
    }

    return new Error("Caught exception is not an Error instance, and has been wrapped.", { cause: e });
}