import type React from "react"
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { FlowProviderWrapper } from "@/components/flow-provider-wrapper"
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
      <body className={`font-sans ${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`} suppressHydrationWarning>
        <FlowProviderWrapper>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            {children}
            <Analytics />
          </Suspense>
        </FlowProviderWrapper>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
