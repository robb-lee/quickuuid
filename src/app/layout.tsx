/**
 * Root Layout for UUID Generator App
 * 
 * Provides theme support, font optimization, and global styling.
 */

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "QuickUUID - Fast, secure, and customizable UUID generation",
    template: "%s | QuickUUID"
  },
  description: "Fast, secure, and customizable UUID generator with real-time formatting, copy functionality, and dark mode support.",
  keywords: [
    "UUID",
    "GUID", 
    "Generator",
    "TypeScript",
    "Next.js",
    "React",
    "Cryptographic",
    "Random",
    "Identifier"
  ],
  authors: [
    {
      name: "QuickUUID Team",
    },
  ],
  creator: "QuickUUID",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://quickuuid.app",
    title: "QuickUUID - Fast & Secure",
    description: "Generate cryptographically secure UUIDs with customizable formatting options.",
    siteName: "QuickUUID",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuickUUID - Fast & Secure",
    description: "Generate cryptographically secure UUIDs with customizable formatting options.",
    creator: "@quickuuid",
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
  icons: [
    { rel: "icon", type: "image/x-icon", url: "/favicon.ico" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/favicon-16x16.png" },
    { rel: "apple-touch-icon", sizes: "180x180", url: "/apple-touch-icon.png" },
    { rel: "icon", type: "image/png", sizes: "192x192", url: "/android-chrome-192x192.png" },
    { rel: "icon", type: "image/png", sizes: "512x512", url: "/android-chrome-512x512.png" },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  colorScheme: "light dark",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="uuid-generator-theme"
        >
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
          </div>
          <Toaster
            position="bottom-right"
            expand={true}
            richColors
            closeButton
            toastOptions={{
              duration: 3000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
