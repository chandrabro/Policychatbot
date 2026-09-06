import type { Metadata } from "next";
import { Newsreader, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal"],
  adjustFontFallback: false,
  variable: "--font-display",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Policy Assistant",
  description: "Ask questions about company policy and get sourced answers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${sans.variable} ${mono.variable} font-sans bg-paper text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
