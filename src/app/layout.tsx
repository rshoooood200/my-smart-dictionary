import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "قاموسي الذكي - Vocabulary Learning App",
    template: "%s | قاموسي الذكي",
  },
  description: "تطبيق ذكي لحفظ ومراجعة الكلمات الإنجليزية مع نظام مراجعة متطور ودعم الذكاء الاصطناعي",
  keywords: ["vocabulary", "learning", "English", "Arabic", "flashcards", "education", "قاموس", "تعلم", "إنجليزي"],
  authors: [{ name: "قاموسي الذكي" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/app-icon.png",
    apple: "/app-icon.png",
    shortcut: "/app-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "قاموسي الذكي",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: "/",
    siteName: "قاموسي الذكي",
    title: "قاموسي الذكي - Vocabulary Learning App",
    description: "تطبيق ذكي لحفظ ومراجعة الكلمات الإنجليزية",
    images: [
      {
        url: "/app-icon.png",
        width: 1024,
        height: 1024,
        alt: "قاموسي الذكي",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "قاموسي الذكي",
    description: "تطبيق ذكي لحفظ ومراجعة الكلمات الإنجليزية",
    images: ["/app-icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SW registered: ', registration.scope);
                    },
                    function(err) {
                      console.log('SW registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
// cache bust 1773116066
