import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Varendra University Knowledge Base - Admin Portal",
  description: "Official Document & Knowledge Management System for Varendra University, Rajshahi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-blue-600/30 selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
