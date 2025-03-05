// This fixes the issue with `params` in Next.js App Router pages
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Next.js App Router types will be fixed in Next.js 14
declare module "next/types" {
  interface PageProps {
    params: { [key: string]: string }
  }
}