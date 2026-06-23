import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apotek Care Dashboard — Sales & Operations Insights 2015",
  description: "Interactive dashboard for drug sales analysis in 2015 based on SQLite/Parquet pipeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
