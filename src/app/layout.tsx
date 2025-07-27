import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import LayoutClientWrapper from "./LayoutClientWrapper";
import Script from "next/script";

// Initialize background services (backup scheduler, etc.)
import '../lib/startup/initializeServices';

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Beiersdorf Media Nebula",
  description: "Beiersdorf Media Nebula - Advanced analytics and campaign management for global media operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-G4P0N953RF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-G4P0N953RF');
          `}
        </Script>
      </head>
      <body
        className={`${quicksand.variable} font-quicksand antialiased bg-gray-50`}
      >
        <LayoutClientWrapper>
          {children}
        </LayoutClientWrapper>
      </body>
    </html>
  );
}
