import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Autobanden en Velgen",
  description: "Nieuw of 2e hands",
  generator: "v0.dev",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [{ url: "/favicon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                alert('Banden.autos © 2025');
                return false;
              });
              
              document.addEventListener('keydown', function(e) {
                // Prevent Ctrl+U (View Source)
                if (e.ctrlKey && e.key === 'u') {
                  e.preventDefault();
                  return false;
                }
                // Prevent Ctrl+Shift+I (Developer Tools)
                if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                  e.preventDefault();
                  return false;
                }
                // Prevent Ctrl+Shift+J (Developer Tools)
                if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                  e.preventDefault();
                  return false;
                }
                // Prevent Ctrl+S (Save Page)
                if (e.ctrlKey && e.key === 's') {
                  e.preventDefault();
                  return false;
                }
              });

              // Prevent text selection
              document.addEventListener('selectstart', function(e) {
                e.preventDefault();
                return false;
              });

              // Prevent drag and drop
              document.addEventListener('dragstart', function(e) {
                e.preventDefault();
                return false;
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <main className="flex-grow">
          {children}
        </main>
        <footer className="w-full py-4 text-center text-sm text-gray-600 bg-white border-t">
          Banden.autos © 2025
        </footer>
        <Script id="tradetracker-supertag" strategy="afterInteractive">
          {`
            var _TradeTrackerTagOptions = {
                t: 'a',
                s: '490995',
                chk: 'c5d1002ad7b9d5ee923af122c597310f',
                overrideOptions: {}
            };

            (function() {
              var tt = document.createElement('script'), s = document.getElementsByTagName('script')[0];
              tt.setAttribute('type', 'text/javascript');
              tt.setAttribute('src', (document.location.protocol == 'https:' ? 'https' : 'http') + '://tm.tradetracker.net/tag?t=' + _TradeTrackerTagOptions.t + '&s=' + _TradeTrackerTagOptions.s + '&chk=' + _TradeTrackerTagOptions.chk);
              s.parentNode.insertBefore(tt, s);
            })();
          `}
        </Script>
      </body>
    </html>
  )
}
