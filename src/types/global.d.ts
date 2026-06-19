import type { MediaVaultApi } from '../../electron/preload';

declare global {
  interface Window {
    /** Typed bridge exposed by the preload script. */
    mediavault: MediaVaultApi;
  }
}

export {};
