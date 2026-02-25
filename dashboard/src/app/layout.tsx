import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "trustmrrr ༼ つ ╹ ╹ ༽つ",
  description: "986 startups. every mrr. every revenue. scraped, verified, searchable.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.visitors.now/v.js"
          data-token="b0adf01d-fa2b-401e-bcab-cfc6262df06b"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
