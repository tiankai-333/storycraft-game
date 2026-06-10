// Bootstrap: polyfill browser APIs before any module graph loads
(globalThis as any).localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

// Dynamic import so the polyfill runs first
import("./index.ts");
