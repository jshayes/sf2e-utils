declare module "@foundryvtt/foundryvtt-cli" {
  interface CompilePackOptions {
    nedb?: boolean;
    yaml?: boolean;
    log?: boolean;
    recursive?: boolean;
  }

  interface ExtractPackOptions {
    nedb?: boolean;
    yaml?: boolean;
    log?: boolean;
    clean?: boolean;
    folders?: boolean;
    omitVolatile?: boolean;
    documentType?: string;
  }

  export function compilePack(
    src: string,
    dest: string,
    options?: CompilePackOptions,
  ): Promise<void>;

  export function extractPack(
    src: string,
    dest: string,
    options?: ExtractPackOptions,
  ): Promise<void>;
}
