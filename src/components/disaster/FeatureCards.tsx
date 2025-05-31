'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Cloud, Download, Share2, Camera, Globe, Zap, Heart } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Military-Grade Encryption',
    description: 'Your documents are encrypted with AES-256, the same standard used by the U.S. military',
    detail: 'End-to-end encryption ensures only you can access your files',
    gradient: 'from-purple-500 to-indigo-500'
  },
  {
    icon: Cloud,
    title: 'Triple-Redundant Cloud Storage',
    description: 'Documents stored across 3 geographic regions simultaneously',
    detail: 'If one data center fails, your documents remain safe and accessible',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Download,
    title: 'Instant Access Anywhere',
    description: 'Download your entire document vault with one click, even offline',
    detail: 'Mobile app works without internet during emergencies',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Share2,
    title: 'Emergency Sharing',
    description: 'Grant temporary access to family, FEMA, or insurance companies',
    detail: 'Time-limited, revocable access with full audit trail',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: Camera,
    title: 'Smart Document Capture',
    description: 'AI-powered scanning automatically categorizes and tags documents',
    detail: 'OCR technology makes all documents searchable instantly',
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    icon: Globe,
    title: 'Global Accessibility',
    description: 'Access from any device, anywhere in the world',
    detail: 'Multi-language support for international documents',
    gradient: 'from-indigo-500 to-purple-500'
  }
]

export default function FeatureCards() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="group relative"
        >
          <div className="relative h-full glassmorphic-card p-6 hover:scale-105 transition-all duration-300 overflow-hidden">
            {/* Background gradient effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
            
            {/* Icon container */}
            <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.gradient} mb-4`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            
            {/* Content */}
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground mb-3">{feature.description}</p>
            <p className="text-sm text-muted-foreground/80">{feature.detail}</p>
            
            {/* Hover effect indicator */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient} animate-pulse`} />
            </div>
          </div>
        </motion.div>
      ))}
      
      {/* Bonus features */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6 }}
        className="md:col-span-2 lg:col-span-3"
      >
        <div className="glassmorphic-card p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
          
          <div className="relative text-center">
            <h3 className="text-2xl font-bold mb-4">Plus These Critical Features</h3>
            
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">Auto-Backup</h4>
                <p className="text-sm text-muted-foreground">Continuous protection as you add documents</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">Version History</h4>
                <p className="text-sm text-muted-foreground">Never lose important document versions</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">Family Vault</h4>
                <p className="text-sm text-muted-foreground">Protect your whole family's documents</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}