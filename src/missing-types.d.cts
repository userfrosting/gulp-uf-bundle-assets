// TODO Typings here cannot be made 100% accurate until array contents unions are supported
declare module "just-extend" {
    function extend<T extends object, U extends object>(target: T, source: U): T & U;
    function extend<T extends object, U extends object, V extends object>(target: T, source1: U, source2: V): T & U & V;
    function extend<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
    function extend<T extends object>(target: Partial<T>, ...sources: Partial<T>[]): T;

    function extend<T extends object, U extends object>(deep: boolean, target: T, source: U): T & U;
    function extend<T extends object, U extends object, V extends object>(deep: boolean, target: T, source1: U, source2: V): T & U & V;
    function extend<T extends object, U extends object, V extends object, W extends object>(deep: boolean, target: T, source1: U, source2: V, source3: W): T & U & V & W;
    function extend<T extends object>(deep: boolean, target: Partial<T>, ...sources: Partial<T>[]): T;

    export = extend;
}
