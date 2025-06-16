'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-semibold">LifeNavigator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Title Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 30, 2025
            </p>
          </div>

          {/* Terms Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              Terms of Service will be available when LifeNavigator launches. 
              By joining our waitlist, you agree to receive updates about our service.
            </p>
            
            <div className="bg-primary/10 rounded-lg p-6 border border-primary/20">
              <h3 className="text-xl font-semibold mb-3 text-foreground">Waitlist Terms</h3>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li>Joining the waitlist does not guarantee access to LifeNavigator</li>
                <li>We will notify you via email when LifeNavigator becomes available</li>
                <li>Your position in the waitlist may change based on referrals and other factors</li>
                <li>You can unsubscribe from the waitlist at any time</li>
                <li>We will not sell or share your information with third parties</li>
              </ul>
            </div>
          </div>

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <Link
              href="/signup"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Join the Waitlist
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}