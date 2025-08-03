import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://corefoundry.com"),
  title: "CoreFoundry",
  description:
    "Un ERP modular construido con tecnologías modernas, diseñado para ser flexible, escalable y fácil de extender.",
  keywords: ["ERP", "modular", "flexible", "escalable", "negocio"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "CoreFoundry - ERP modular y escalable",
    description:
      "Un ERP modular construido con tecnologías modernas, diseñado para ser flexible, escalable y fácil de extender.",
    url: "https://corefoundry.com",
    siteName: "CoreFoundry",
    images: ["https://corefoundry.com/file.svg"],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoreFoundry - ERP modular y escalable",
    description:
      "Un ERP modular construido con tecnologías modernas, diseñado para ser flexible, escalable y fácil de extender.",
    images: ["https://corefoundry.com/file.svg"],
  },
};

export function generateViewport() {
  return {
    viewport: "width=device-width, initial-scale=1",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
