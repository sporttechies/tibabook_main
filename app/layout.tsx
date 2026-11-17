import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TibaBook | Care, on your time",
  description:
    "Find a trusted clinic, choose your doctor, and book an appointment in a few simple steps.",
  applicationName: "TibaBook",
};

export const viewport: Viewport = {
  themeColor: "#F2F6F8",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
