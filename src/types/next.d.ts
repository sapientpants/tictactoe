// Declare the types for Next.js App Router page components
declare module 'next' {
  export type NextPageParams<P = {[key: string]: string}> = {
    params: P;
  };
}