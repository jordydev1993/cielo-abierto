import type { Metadata } from 'next'
import { Overpass } from 'next/font/google'
import './globals.css'

const overpass = Overpass({
  variable: '--font-overpass',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Argüello Infancias — Sistema de Gestión',
  description: 'Sistema de gestión para residencia de NNyA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${overpass.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
