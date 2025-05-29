'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Flame, AlertTriangle, Home, FileX, Clock } from 'lucide-react'

const timelineEvents = [
  {
    time: '8:06 AM',
    title: 'Fire Spotted',
    description: 'Camp Fire ignites near Camp Creek Road',
    icon: Flame,
    color: 'text-orange-500'
  },
  {
    time: '8:14 AM',
    title: 'Evacuation Orders',
    description: 'First evacuation orders issued for Paradise',
    icon: AlertTriangle,
    color: 'text-red-500'
  },
  {
    time: '8:27 AM',
    title: 'Residents Fleeing',
    description: 'Gridlock as 26,000+ residents evacuate',
    icon: Home,
    color: 'text-yellow-500'
  },
  {
    time: '11:00 AM',
    title: 'Town Destroyed',
    description: '95% of Paradise destroyed by flames',
    icon: FileX,
    color: 'text-red-600'
  },
  {
    time: 'Next 6 Months',
    title: 'Struggle to Rebuild',
    description: 'Residents battle to prove ownership, insurance, identity',
    icon: Clock,
    color: 'text-gray-500'
  }
]

export default function TimelineVisualization() {
  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Timeline Line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-orange-500 via-red-500 to-gray-500 opacity-30" />
      
      {/* Timeline Events */}
      {timelineEvents.map((event, index) => (
        <motion.div
          key={event.time}
          initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.2 }}
          className={`relative flex items-center mb-12 ${
            index % 2 === 0 ? 'justify-start' : 'justify-end'
          }`}
        >
          <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
            <div className="glassmorphic-card p-6 hover:scale-105 transition-transform">
              <div className={`flex items-center gap-3 mb-2 ${
                index % 2 === 0 ? 'justify-end' : 'justify-start'
              }`}>
                <event.icon className={`w-6 h-6 ${event.color}`} />
                <span className="text-2xl font-bold">{event.time}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          </div>
          
          {/* Center dot */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 + 0.1 }}
              className={`w-4 h-4 ${event.color} bg-current rounded-full ring-4 ring-background`}
            />
          </div>
        </motion.div>
      ))}

      {/* What Was Lost Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-20 text-center"
      >
        <h3 className="text-2xl font-bold mb-8">What Was Lost in Minutes</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { icon: '📸', label: 'Photo Albums', status: 'Irreplaceable' },
            { icon: '📋', label: 'Insurance Docs', status: 'Needed for Claims' },
            { icon: '🏠', label: 'Property Deeds', status: 'Proof of Ownership' },
            { icon: '💰', label: 'Tax Returns', status: 'FEMA Required' },
            { icon: '🏥', label: 'Medical Records', status: 'Treatment Disrupted' }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="glassmorphic-card p-4 hover:border-red-500/50 transition-all">
                <div className="text-4xl mb-2 group-hover:animate-pulse">{item.icon}</div>
                <h4 className="font-semibold text-sm">{item.label}</h4>
                <p className="text-xs text-red-500 mt-1">{item.status}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}