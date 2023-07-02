import { Analytics } from "@vercel/analytics/react";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import NextNProgress from "nextjs-progressbar";
import { type ReactElement, type ReactNode } from "react";
import "../app/globals.css";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function Home({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return getLayout(
    <>
      <NextNProgress color="#8B5CF6" options={{ showSpinner: false }} />
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
