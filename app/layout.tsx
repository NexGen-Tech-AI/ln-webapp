import '../src/index.css'
import { ClientProviders } from '@/components/providers/ClientProviders'
import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'

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
    <html lang="en" className="dark">
      <body className="dark bg-background text-foreground">
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30 selection:text-primary-foreground">
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