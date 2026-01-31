import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AXIUM - Temporary File Transfer",
  description: "Upload. Share. Expire. Temporary file sharing that deletes itself.",
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230a0a0a"/><text x="50" y="68" font-family="monospace" font-size="50" font-weight="bold" fill="%23f5f5f0" text-anchor="middle">A</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
