import './globals.css'
import { Roboto } from 'next/font/google'
import { Providers } from './providers'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
})

export const metadata = {
  title: 'My Carry-On',
  description: 'Pack smarter, travel lighter.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body><Providers>{children}</Providers></body>
    </html>
  )
}
