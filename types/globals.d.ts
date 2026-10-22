
declare type ArrayElement<A> = A extends ReadonlyArray<infer T> ? T : never;

declare type Empty = Record<any, never>;

declare interface JustId { id: string }

declare type DeepPartial<T> = T extends Array<infer U> ? T | Record<number, DeepPartial<U>>
  : T extends object ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

