// CSS side-effect imports (non-module)
declare module "*.css" {}

// Raw content imports (e.g. *.md?raw, *.txt?raw)
declare module "*?raw" {
  const src: string;
  export default src;
}

// Vite import.meta.env (PROD, DEV, MODE, BASE_URL, SSR)
interface ImportMetaEnv {
  BASE_URL: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
  SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
