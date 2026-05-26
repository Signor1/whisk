/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** WalletConnect Cloud project ID — optional, enables WC v2 connector. */
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
