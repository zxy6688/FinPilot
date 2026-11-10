import { createContext, useContext, useState } from "react";
export type MicroValues = Record<string, number | string | boolean>;
export const MicroState = createContext<{
  values: MicroValues;
  change: (key: string, value: number | string | boolean) => void;
  errors: Record<string, string>;
  validate: (key: string, error: string) => void;
} | null>(null);
export function useMicroValue<T extends number | string | boolean>(
  key: string,
  initial: T,
): [T, (value: T) => void] {
  const context = useContext(MicroState),
    [local, setLocal] = useState(initial);
  return [
    context && typeof context.values[key] === typeof initial
      ? (context.values[key] as T)
      : local,
    (value) => (context ? context.change(key, value) : setLocal(value)),
  ];
}
