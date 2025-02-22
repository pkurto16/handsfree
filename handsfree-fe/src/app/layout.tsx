import { HandsFreeProvider } from '@/contexts/HandsFreeContext'
import { ThemeProvider } from "@/components/theme-provider"
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HandsFree Control',
  description: 'Control your computer using just your eyes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <HandsFreeProvider>
            {children}
          </HandsFreeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}