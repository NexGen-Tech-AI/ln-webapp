'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Martinez',
    location: 'Paradise, CA',
    disaster: 'Camp Fire Survivor',
    image: '👩‍💼',
    quote: "I grabbed my kids and ran. Everything else burned. But LifeNavigator had our birth certificates, insurance papers, everything. FEMA processed our claim in days, not months.",
    highlight: 'Claim processed in 3 days',
    date: 'November 2018'
  },
  {
    id: 2,
    name: 'Robert Chen',
    location: 'Houston, TX',
    disaster: 'Hurricane Harvey',
    image: '👨‍👩‍👧',
    quote: "Four feet of water in our home. Physical documents? Gone. But I pulled up LifeNavigator on my phone at the shelter and had everything for insurance right there.",
    highlight: 'Full insurance payout received',
    date: 'August 2017'
  },
  {
    id: 3,
    name: 'Emily Thompson',
    location: 'Nashville, TN',
    disaster: 'Tornado',
    image: '👩‍🦰',
    quote: "The tornado took our entire neighborhood. Finding our deed and mortgage docs in LifeNavigator meant we could start rebuilding immediately while neighbors waited months.",
    highlight: 'Rebuilding started in 2 weeks',
    date: 'March 2020'
  },
  {
    id: 4,
    name: 'James Wilson',
    location: 'Malibu, CA',
    disaster: 'Woolsey Fire',
    image: '👨‍🦲',
    quote: "As a business owner, losing my tax documents would have been catastrophic. LifeNavigator saved my business. I had everything the IRS needed.",
    highlight: 'Business operational in 10 days',
    date: 'November 2018'
  },
  {
    id: 5,
    name: 'Maria Gonzalez',
    location: 'Miami, FL',
    disaster: 'Hurricane Irma',
    image: '👩‍⚕️',
    quote: "My mother's medical records were crucial for her continued treatment after evacuation. LifeNavigator literally saved her life by having her prescriptions and history.",
    highlight: 'Medical care uninterrupted',
    date: 'September 2017'
  }
]

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const handlePrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const handleNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Main testimonial card */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTestimonial.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="glassmorphic-card p-8 md:p-12"
          >
            {/* Quote icon */}
            <Quote className="absolute top-4 right-4 w-16 h-16 text-primary/10" />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start gap-6 mb-6">
                <div className="text-6xl">{currentTestimonial.image}</div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-1">{currentTestimonial.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{currentTestimonial.location}</span>
                    <span>•</span>
                    <span className="text-orange-500 font-medium">{currentTestimonial.disaster}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{currentTestimonial.date}</p>
                </div>
              </div>
              
              <blockquote className="text-lg md:text-xl mb-6 leading-relaxed">
                "{currentTestimonial.quote}"
              </blockquote>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">{currentTestimonial.highlight}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="pointer-events-auto -translate-x-12 hover:scale-110 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="pointer-events-auto translate-x-12 hover:scale-110 transition-transform"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>
      
      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAutoPlaying(false)
              setCurrentIndex(index)
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-primary'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>
      
      {/* Stats section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12"
      >
        {[
          { number: '50,000+', label: 'Protected Families' },
          { number: '$2.3M', label: 'Claims Processed' },
          { number: '48hrs', label: 'Avg. Claim Time' },
          { number: '99.9%', label: 'Uptime During Disasters' }
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="glassmorphic-card p-4 text-center"
          >
            <p className="text-2xl font-bold gradient-text">{stat.number}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}