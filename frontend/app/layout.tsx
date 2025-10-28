import type React from "react"
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { FlowProviderWrapper } from "@/components/flow-provider-wrapper"
import { ThemeProvider } from "@/contexts/theme-context"
import type { Metadata, Viewport } from "next"
import "./globals.css"

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#00EF8B" />
        <meta name="msapplication-TileColor" content="#00EF8B" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`font-sans ${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <FlowProviderWrapper>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
              {children}
              <Analytics />
            </Suspense>
          </FlowProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: {
    default: "FlowPilot - Autonomous Agent Management for Flow Blockchain",
    template: "%s | FlowPilot"
  },
  description: "Empowering the Flow Forte upgrade with user-friendly on-chain agents. Create, manage, and monitor autonomous agents using Scheduled Transactions without writing code.",
  keywords: [
    "Flow blockchain",
    "autonomous agents",
    "scheduled transactions",
    "Flow Forte",
    "no-code automation",
    "blockchain automation",
    "recurring payments",
    "FLOW tokens",
    "Cadence",
    "DeFi",
    "Web3",
    "agent management",
    "payment automation"
  ],
  authors: [{ name: "FlowPilot Team" }],
  creator: "FlowPilot",
  publisher: "FlowPilot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://flowpilot.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://flowpilot.app",
    title: "FlowPilot - Autonomous Agent Management for Flow Blockchain",
    description: "Empowering the Flow Forte upgrade with user-friendly on-chain agents. Create, manage, and monitor autonomous agents using Scheduled Transactions without writing code.",
    siteName: "FlowPilot",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "FlowPilot - Autonomous Agent Management for Flow Blockchain",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowPilot - Autonomous Agent Management for Flow Blockchain",
    description: "Empowering the Flow Forte upgrade with user-friendly on-chain agents. Create, manage, and monitor autonomous agents using Scheduled Transactions without writing code.",
    images: ["/og-image.svg"],
    creator: "@flowpilot",
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
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#00EF8B" },
    ],
  },
  manifest: "/site.webmanifest",
  category: "technology",
  classification: "Blockchain, Web3, DeFi, Automation",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "FlowPilot",
    "application-name": "FlowPilot",
    "msapplication-TileColor": "#00EF8B",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
};
