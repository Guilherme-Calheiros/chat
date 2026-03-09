import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UsernameProvider } from "./context/UsernameProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "WebChat",
  description: "Live chat",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UsernameProvider>
          {children}
        </UsernameProvider>
      </body>
    </html>
  );
}
