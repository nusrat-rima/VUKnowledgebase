import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VuKnowledgeBase - Intelligent Document & Vector Knowledge Base",
  description: "AI-powered knowledge base searching PDFs, scraped website information, and documents with Gemini and NeonDB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
