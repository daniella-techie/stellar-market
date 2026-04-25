import { getRequestId } from "./request-context";

let consolePatched = false;

function formatConsoleArgs(args: unknown[]): unknown[] {
  const requestId = getRequestId();
  if (!requestId) {
    return args;
  }

  if (args.length === 0) {
    return [`[request:${requestId}]`];
  }

  const [first, ...rest] = args;
  if (typeof first === "string") {
    return [`[request:${requestId}] ${first}`, ...rest];
  }

  return [`[request:${requestId}]`, first, ...rest];
}

export function installRequestIdConsolePatch(): void {
  if (consolePatched) {
    return;
  }

  for (const method of ["log", "info", "warn", "error", "debug"] as const) {
    const original = console[method].bind(console);
    console[method] = ((...args: unknown[]) => {
      original(...formatConsoleArgs(args));
    }) as typeof console[typeof method];
  }

  consolePatched = true;
}
