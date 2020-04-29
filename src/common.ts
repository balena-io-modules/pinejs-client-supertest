export type UserParam = string | Partial<{ token: string }>;

export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
