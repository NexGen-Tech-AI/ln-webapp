'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Shield, Clock, Download, Globe, Lock, Share2, Camera, FolderOpen, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import ParticleBackground from '@/components/disaster/ParticleBackground'
import TimelineVisualization from '@/components/disaster/TimelineVisualization'
import DisasterChecklist from '@/components/disaster/DisasterChecklist'
import FeatureCards from '@/components/disaster/FeatureCards'
import DisasterTypeSelector from '@/components/disaster/DisasterTypeSelector'
import PeaceOfMindCalculator from '@/components/disaster/PeaceOfMindCalculator'
import QuickStartGuide from '@/components/disaster/QuickStartGuide'

export default function DisasterPreparednessPage() {
  const [documentsProtected, setDocumentsProtected] = useState(1000)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    
    // Fetch actual user count and calculate documents
    const fetchCounts = async () => {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      
      if (!error && count) {
        // Base 1000 documents + 10 documents per user (estimation)
        setDocumentsProtected(1000 + (count * 10))
      }
    }

    fetchCounts()
    
    // Update count every 30 seconds to show growth
    const interval = setInterval(fetchCounts, 30000)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <ParticleBackground />
        
        {/* Split Screen Background */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1564121211835-e88c852648ab?q=80&w=2070)',
                transform: `translateY(${scrollY * 0.5}px)`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          </div>
          <div className="w-1/2 relative">
            <div className="absolute inset-0 bg-gradient-to-l from-primary/10 to-transparent" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              When You Have <span className="text-orange-500">Minutes</span> to Evacuate,<br />
              Your Life's Documents Are <span className="text-primary">Already Safe</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands protecting their vital documents before disaster strikes
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                className="bg-primary-gradient text-primary-foreground text-lg px-8 py-6 rounded-md hover:opacity-90 transition-opacity"
                onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Secure Your Documents Now
              </button>
              <button
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground text-lg px-8 py-6 rounded-md transition-colors"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </button>
            </div>

            {/* Counter */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="inline-block"
            >
              <div className="bg-background/50 backdrop-blur-md border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">Documents Protected</p>
                <p className="text-4xl font-bold gradient-text">
                  {documentsProtected.toLocaleString()}
                </p>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-12">
              {[
                { icon: Lock, text: 'Military-Grade Encryption' },
                { icon: Globe, text: 'Accessible Anywhere' },
                { icon: Shield, text: 'FEMA-Ready' }
              ].map((badge, index) => (
                <motion.div
                  key={badge.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-sm border border-border rounded-full"
                >
                  <badge.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm">{badge.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="w-8 h-8 text-muted-foreground" />
        </motion.div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              20 Minutes. That's All They Had.
            </h2>
            <p className="text-xl text-muted-foreground">
              The Paradise Camp Fire timeline that changed everything
            </p>
          </motion.div>
          
          <TimelineVisualization />
        </div>
      </section>

      {/* Interactive Checklist */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Are You Disaster Ready?
            </h2>
          </motion.div>
          
          <DisasterChecklist />
        </div>
      </section>

      {/* How LifeNavigator Protects You */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Your Digital Fortress
            </h2>
            <p className="text-xl text-muted-foreground">
              Six layers of protection between your documents and disaster
            </p>
          </motion.div>
          
          <FeatureCards />
        </div>
      </section>


      {/* Disaster Type Selector */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Prepared for Any Emergency
            </h2>
            <p className="text-xl text-muted-foreground">
              Click each disaster type to see specific document needs
            </p>
          </motion.div>
          
          <DisasterTypeSelector />
        </div>
      </section>

      {/* Peace of Mind Calculator */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              What's Your Peace of Mind Worth?
            </h2>
          </motion.div>
          
          <PeaceOfMindCalculator />
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Disaster-Proof Your Life in 10 Minutes
            </h2>
          </motion.div>
          
          <QuickStartGuide />
        </div>
      </section>

      {/* Final CTA */}
      <section id="waitlist" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-orange-500/20" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Don't Wait for the Warning Sirens
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join 50,000+ people who sleep better knowing they're prepared
            </p>

            <div className="bg-background/50 backdrop-blur-md border border-border rounded-lg p-8 max-w-md mx-auto">
              <form className="space-y-4">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:outline-none"
                />
                <select className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:outline-none">
                  <option>Pro Navigator - $20/mo</option>
                  <option>AI Navigator+ - $99/mo</option>
                  <option>Family Navigator - $35/mo</option>
                </select>
                <button className="w-full bg-primary-gradient text-primary-foreground text-lg py-6 rounded-md hover:opacity-90 transition-opacity">
                  Secure My Spot
                </button>
              </form>

              <div className="mt-6 space-y-2">
                <p className="flex items-center justify-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  10% discount for waitlist members
                </p>
                <p className="flex items-center justify-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Disaster Preparedness Guide (free)
                </p>
                <p className="flex items-center justify-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Priority access when we launch
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}