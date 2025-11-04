import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { seoConfig } from "@/lib/seo-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: seoConfig.title,
    template: `%s | ${seoConfig.event.name}`,
  },
  description: seoConfig.description,
  keywords: seoConfig.keywords,
  authors: [
    { name: "GDG Managua", url: seoConfig.social.gdgCommunity },
  ],
  creator: "GDG Managua",
  publisher: "Google Developer Groups Managua",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_NI",
    url: process.env.NEXT_PUBLIC_APP_DOMAIN || "https://devfest-managua.app",
    title: seoConfig.openGraph.title,
    description: seoConfig.openGraph.description,
    siteName: seoConfig.openGraph.siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.openGraph.title,
    description: seoConfig.openGraph.description,
    creator: seoConfig.social.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
