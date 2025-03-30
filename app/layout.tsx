// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import MainNav from "@/components/MainNav"; // Import the new Nav component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sandwich Shop OMS",
  description: "Order Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-secondary/40 font-sans antialiased", // Slightly adjust background
          inter.className
        )}
      >
        <MainNav /> {/* Add the Nav Bar here */}
        <main className="flex-grow"> {/* Removed container from here */}
             {children} {/* Page content will now have its own container */}
        </main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}