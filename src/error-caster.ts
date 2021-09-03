import ono, { ErrorLike } from "@jsdevtools/ono";

/**
 * @todo Replace with [error cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error#rethrowing_an_error_with_a_cause) once in stage 4.
 */
export function errorCaster(e: unknown): Error {
    if (e instanceof Error) {
        return e;
    }

    return ono(e as ErrorLike, "Caught exception is not an Error instance, and has been wrapped.");
}