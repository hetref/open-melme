import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { RootProvider } from 'fumadocs-ui/provider/next';

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  title: 'MelMe - Your Domain. Unlimited Business Emails. Zero Complexity.',
  description: 'Professional domain-based email management platform. Create unlimited email aliases on your domain instantly, with no mail server required. DKIM verified, secure, and easy to use.',
  keywords: ['email', 'domain email', 'email aliases', 'business email', 'DKIM', 'email management', 'professional email', 'secure email', 'email forwarding'],
  authors: [{ name: 'Aryan Shinde' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'MelMe - Your Domain. Unlimited Business Emails. Zero Complexity.',
    description: 'Create unlimited email aliases on your domain instantly, with no mail server required.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MelMe - Your Domain. Unlimited Business Emails. Zero Complexity.',
    description: 'Create unlimited email aliases on your domain instantly, with no mail server required.',
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#08080e' },
  ],
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = savedTheme || (prefersDark ? 'dark' : 'dark');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${bricolage.variable} ${dmSans.variable} font-sans flex flex-col min-h-screen antialiased bg-background text-foreground`}>
        <RootProvider>{children}</RootProvider>
        <Toaster />
      </body>
    </html>
  )
}
