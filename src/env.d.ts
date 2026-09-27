/// <reference types="vite/client" />

interface ViteTypeOptions {
  // Without it, vite/client types every unknown import.meta.env key as `any`.
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  /** Always set: vite.config.ts defines it, with a local fallback. */
  readonly VITE_SITE_URL: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
}
