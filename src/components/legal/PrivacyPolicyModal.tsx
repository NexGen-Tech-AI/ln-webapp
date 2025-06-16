'use client'

import React from 'react'
import { X, Shield, ScrollText, ExternalLink } from 'lucide-react'
import { privacyPolicyContent } from '@/content/privacy-policy'

interface PrivacyPolicyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="relative min-h-screen py-4 px-2 sm:py-6 sm:px-4 flex items-center justify-center">
        <div className="relative w-full max-w-6xl bg-background border border-border rounded-lg shadow-2xl flex flex-col h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] my-auto animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Privacy Policy</h2>
                <p className="text-xs text-muted-foreground">LifeNavigator Waitlist</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Close privacy policy"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 lg:p-12 bg-white dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            <div className="prose prose-sm sm:prose lg:prose-lg prose-gray dark:prose-invert max-w-none">
              <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-foreground mb-1">
                  <strong>Effective Date:</strong> {privacyPolicyContent.effectiveDate}
                </p>
                <p className="text-sm text-foreground">
                  <strong>Last Updated:</strong> {privacyPolicyContent.lastUpdated}
                </p>
              </div>

              {privacyPolicyContent.sections.map((section, index) => (
                <div key={index} className="mb-8">
                  <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-primary" />
                    {section.title}
                  </h3>
                  
                  {section.content && (
                    <p className="mb-4 text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  )}

                  {section.items && (
                    <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="ml-4">{item}</li>
                      ))}
                    </ul>
                  )}

                  {section.subsections && section.subsections.map((subsection, subIndex) => (
                    <div key={subIndex} className="ml-4 mb-4">
                      <h4 className="font-semibold mb-2 text-foreground">{subsection.title}</h4>
                      {subsection.content && (
                        <p className="mb-2 text-muted-foreground">{subsection.content}</p>
                      )}
                      {subsection.items && (
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {subsection.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="ml-4">{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  {section.additionalContent && (
                    <p className="mt-4 text-muted-foreground">
                      {section.additionalContent}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 sm:p-6 border-t border-border bg-accent/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                By using our services, you agree to this Privacy Policy
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                >
                  I Understand
                </button>
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors font-medium flex items-center justify-center gap-2"
                >
                  Full Page
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Privacy Policy Link Component
interface PrivacyPolicyLinkProps {
  className?: string
  children?: React.ReactNode
}

export function PrivacyPolicyLink({ className = '', children }: PrivacyPolicyLinkProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`text-primary hover:underline text-sm ${className}`}
      >
        {children || 'Privacy Policy'}
      </button>
      <PrivacyPolicyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}