import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import LayoutClientWrapper from "./LayoutClientWrapper";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MediaIQ Dashboard",
  description: "Track and manage digital marketing performance across platforms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
