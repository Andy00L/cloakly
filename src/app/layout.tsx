import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
// Self-hosted Fraunces (display serif). Registers @font-face for "Fraunces Variable",
// which --font-serif maps to. next/font/google is intentionally avoided: it hangs the
// webpack build on the Google Fonts fetch. sourceRef: .uidesign/cloakly-design-sheet.md.
import "@fontsource-variable/fraunces";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "cloakly — confidential token wrapper registry",
  description:
    "Browse the onchain confidential-token Wrappers Registry, then wrap, unwrap, and user-decrypt ERC-7984 balances on Ethereum Sepolia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
