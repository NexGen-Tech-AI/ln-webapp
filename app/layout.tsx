import '../src/index.css'
import { Inter } from 'next/font/google'
import { ClientProviders } from '@/components/providers/ClientProviders'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LifeNavigator - Navigate Your Empire',
  description: 'Join the waitlist for the ultimate life management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
          <ClientProviders>
            <Navbar />
            <main className="flex-grow pt-20">
              {children}
            </main>
            <Footer />
          </ClientProviders>
        </div>
      </body>
    </html>
  )
}