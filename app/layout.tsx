import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteName, siteUrl } from "@/lib/site";

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Interior Concepts OMS / CRM",
    template: `%s | Interior Concepts OMS`,
  },
  description: "Interior Concepts CRM — workspace for lead management, team workflows, and department dashboards.",
  applicationName: siteName,
  authors: [{ name: siteName }],
  verification: googleSiteVerification
    ? { google: googleSiteVerification }
    : undefined,
  icons: {
    icon: [
      { url: "/Logo/interior-concept-icon-light.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/Logo/interior-concept-icon-light.png",
    apple: "/Logo/interior-concept-icon-light.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#6c47ff",
          borderRadius: "8px",
        },
        elements: {
          formButtonPrimary:
            "bg-[#6c47ff] hover:bg-[#5936d9] text-white",
          card: "shadow-xl rounded-2xl",
          headerTitle: "text-2xl font-bold",
          socialButtonsBlockButton:
            "border border-gray-300 hover:bg-gray-100",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider defaultTheme="light" storageKey="aesthetic-theme">
            {children}
            <Toaster richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

