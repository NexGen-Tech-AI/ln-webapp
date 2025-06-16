'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, ArrowLeft, ScrollText } from 'lucide-react'
import { privacyPolicyContent } from '@/content/privacy-policy'
import { motion } from 'framer-motion'

export default function PrivacyPolicyPage() {
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
              <Shield className="w-5 h-5 text-primary" />
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
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              {privacyPolicyContent.title}
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Effective Date: {privacyPolicyContent.effectiveDate}</span>
              <span className="hidden sm:block">•</span>
              <span>Last Updated: {privacyPolicyContent.lastUpdated}</span>
            </div>
          </div>

          {/* Policy Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {privacyPolicyContent.sections.map((section, index) => (
              <motion.section
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="mb-12"
              >
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3">
                  <ScrollText className="w-6 h-6 text-primary flex-shrink-0" />
                  {section.title}
                </h2>
                
                {section.content && (
                  <p className="mb-6 text-muted-foreground leading-relaxed">
                    {section.content.split('\n\n').map((paragraph, pIndex) => (
                      <span key={pIndex}>
                        {paragraph}
                        {pIndex < section.content.split('\n\n').length - 1 && (
                          <>
                            <br />
                            <br />
                          </>
                        )}
                      </span>
                    ))}
                  </p>
                )}

                {section.items && (
                  <ul className="list-disc list-inside space-y-3 mb-6 text-muted-foreground">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="ml-4 leading-relaxed">{item}</li>
                    ))}
                  </ul>
                )}

                {section.subsections && section.subsections.map((subsection, subIndex) => (
                  <div key={subIndex} className="ml-6 mb-6">
                    <h3 className="text-xl font-semibold mb-3">{subsection.title}</h3>
                    {subsection.content && (
                      <p className="mb-3 text-muted-foreground leading-relaxed">{subsection.content}</p>
                    )}
                    {subsection.items && (
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        {subsection.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="ml-4">{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                {section.additionalContent && (
                  <p className="mt-6 text-muted-foreground leading-relaxed">
                    {section.additionalContent}
                  </p>
                )}
              </motion.section>
            ))}
          </div>

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 p-8 bg-primary/10 rounded-lg border border-primary/20 text-center"
          >
            <h3 className="text-2xl font-bold mb-4 text-foreground">Ready to Take Control of Your Life?</h3>
            <p className="text-foreground/80 mb-6">
              Join the waitlist and be among the first to experience LifeNavigator
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium shadow-lg"
            >
              Join the Waitlist
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}