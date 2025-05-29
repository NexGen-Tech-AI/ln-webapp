'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut } from 'lucide-react';

    const Navbar = () => {
      const pathname = usePathname();
      const { user, logout } = useAuth();
      const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/8d2e5595-333d-4b29-aceb-3caf9db7419a/0bac9eba2ebb123bd12dc9c18a1b9973.png";

      return (
        <motion.nav 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md shadow-lg"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link href="/" className="flex items-center space-x-2">
                <img src={logoUrl} alt="LifeNavigator Logo" className="h-8 w-auto" />
                <span className="text-2xl font-bold gradient-text">LifeNavigator</span>
              </Link>
              <div className="flex items-center space-x-4">
                {pathname !== '/' && (
                  <Button asChild variant="ghost">
                    <Link href="/">
                      🏠 Home
                    </Link>
                  </Button>
                )}
                <Button asChild variant="ghost" className="text-orange-500 hover:text-orange-600">
                  <Link href="/disaster-preparedness">
                    🔥 Disaster Ready
                  </Link>
                </Button>
                {user ? (
                  <>
                    <Button asChild variant="ghost">
                      <Link href="/dashboard">
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" onClick={logout} className="flex items-center space-x-2">
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </Button>
                  </>
                ) : (
                  <>
                    {pathname !== '/login' && (
                      <Button asChild variant="ghost">
                        <Link href="/login">Login</Link>
                      </Button>
                    )}
                    {pathname !== '/signup' && (
                       <Button asChild className="bg-primary-gradient hover:opacity-90 transition-opacity duration-300 text-primary-foreground font-semibold">
                         <Link href="/signup">Join Waitlist</Link>
                       </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.nav>
      );
    };

    export default Navbar;