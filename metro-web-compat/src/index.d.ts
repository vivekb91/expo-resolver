export interface WebCompatOptions {
  moduleMap?: Record<string, string>;
  overrides?: Record<string, string>;
  fallbackStrategy?: 'graceful' | 'strict';
  webPlatforms?: string[];
  generateMocks?: boolean;
  enableLogging?: boolean;
}

export interface MetroResolver {
  (context: any, moduleName: string, platform: string): any;
}

export interface MetroTransformer {
  transform(config: any): any;
}

export declare function createWebCompatResolver(
  baseResolver: MetroResolver,
  options?: WebCompatOptions
): MetroResolver;

export declare function createWebCompatTransformer(
  baseTransformer: MetroTransformer,
  options?: WebCompatOptions
): MetroTransformer;