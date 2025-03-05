// This file provides custom type declarations for Next.js
// We disable this rule for the whole file because it's a type definition file
// where 'unknown' would be more restrictive than needed
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'next' {
  // Define the Next.js application API
  export default function next(options?: {
    dev?: boolean;
    dir?: string;
    quiet?: boolean;
    conf?: object;
  }): {
    prepare: () => Promise<void>;
    getRequestHandler: () => (req: unknown, res: unknown, parsedUrl?: unknown) => Promise<void>;
    render: (req: unknown, res: unknown, pathname: string, query?: unknown) => Promise<void>;
    renderToHTML: (req: unknown, res: unknown, pathname: string, query?: unknown) => Promise<string>;
    renderError: (err: unknown, req: unknown, res: unknown, pathname: string, query?: unknown) => Promise<void>;
    renderErrorToHTML: (err: unknown, req: unknown, res: unknown, pathname: string, query?: unknown) => Promise<string>;
    serveStatic: (req: unknown, res: unknown, path: string) => Promise<void>;
  };

  // Generic configuration type
  export interface NextConfig {
    [key: string]: unknown;
  }

  // Page metadata type
  export interface Metadata {
    title?: string;
    description?: string;
    [key: string]: unknown;
  }

  // Viewport configuration type
  export interface Viewport {
    width?: string;
    initialScale?: number;
    maximumScale?: number;
    [key: string]: unknown;
  }
}