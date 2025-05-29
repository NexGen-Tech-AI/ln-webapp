'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, CloudRain, Wind, Mountain, Waves, Zap, Home, AlertTriangle } from 'lucide-react'

const disasterTypes = [
  {
    id: 'wildfire',
    name: 'Wildfire',
    icon: Flame,
    color: 'from-orange-500 to-red-500',
    stats: '4.5M homes at risk',
    documents: [
      { type: 'Property deed', reason: 'Prove ownership for rebuilding permits' },
      { type: 'Insurance policies', reason: 'File claims immediately' },
      { type: 'Tax returns', reason: 'FEMA assistance eligibility' },
      { type: 'Home inventory photos', reason: 'Document possessions for insurance' }
    ],
    tip: 'Wildfires move fast. You may have only minutes to evacuate.'
  },
  {
    id: 'hurricane',
    name: 'Hurricane',
    icon: Wind,
    color: 'from-blue-500 to-indigo-500',
    stats: '40M+ in hurricane zones',
    documents: [
      { type: 'Flood insurance', reason: 'Separate from homeowners insurance' },
      { type: 'Vehicle titles', reason: 'Replace flood-damaged vehicles' },
      { type: 'Medical records', reason: 'Continue treatments during evacuation' },
      { type: 'Bank statements', reason: 'Access funds when banks close' }
    ],
    tip: 'Storm surge and flooding cause most hurricane damage.'
  },
  {
    id: 'tornado',
    name: 'Tornado',
    icon: CloudRain,
    color: 'from-gray-500 to-slate-700',
    stats: '1,200 tornadoes yearly',
    documents: [
      { type: 'Safe deposit box contents', reason: 'Banks may be destroyed' },
      { type: 'Birth certificates', reason: 'Replace lost IDs quickly' },
      { type: 'Employment records', reason: 'Prove income for assistance' },
      { type: 'Prescription lists', reason: 'Refill medications immediately' }
    ],
    tip: 'Average warning time is just 13 minutes.'
  },
  {
    id: 'earthquake',
    name: 'Earthquake',
    icon: Mountain,
    color: 'from-amber-600 to-brown-700',
    stats: '143M at risk in US',
    documents: [
      { type: 'Structural reports', reason: 'Pre-existing conditions for insurance' },
      { type: 'Utility account info', reason: 'Restore services quickly' },
      { type: 'Emergency contacts', reason: 'Phone systems often fail' },
      { type: 'Passport/visa', reason: 'May need to relocate internationally' }
    ],
    tip: 'No warning. Documents must be pre-uploaded.'
  },
  {
    id: 'flood',
    name: 'Flood',
    icon: Waves,
    color: 'from-cyan-500 to-blue-600',
    stats: '41M properties at risk',
    documents: [
      { type: 'Elevation certificates', reason: 'Determine flood insurance rates' },
      { type: 'Mortgage documents', reason: 'Work with lender on damaged property' },
      { type: 'Contractor licenses', reason: 'Verify legitimate repair services' },
      { type: 'Immunization records', reason: 'Prevent disease in shelters' }
    ],
    tip: 'Just 1 inch of water can cause $25,000 in damage.'
  },
  {
    id: 'other',
    name: 'Other Emergencies',
    icon: AlertTriangle,
    color: 'from-purple-500 to-pink-500',
    stats: 'Always be prepared',
    documents: [
      { type: 'Will/Trust documents', reason: 'Protect family interests' },
      { type: 'Power of attorney', reason: 'Handle affairs if incapacitated' },
      { type: 'Pet records', reason: 'Board pets during evacuation' },
      { type: 'School records', reason: 'Enroll children in new schools' }
    ],
    tip: 'Any disaster can strike. Complete protection matters.'
  }
]

export default function DisasterTypeSelector() {
  const [selectedDisaster, setSelectedDisaster] = useState(disasterTypes[0])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Disaster type grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {disasterTypes.map((disaster) => (
          <motion.button
            key={disaster.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedDisaster(disaster)}
            className={`
              relative p-6 rounded-lg border transition-all
              ${selectedDisaster.id === disaster.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-background/50 hover:border-primary/50'
              }
            `}
          >
            <div className={`
              w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-r ${disaster.color}
              flex items-center justify-center
            `}>
              <disaster.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-sm">{disaster.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{disaster.stats}</p>
            
            {selectedDisaster.id === disaster.id && (
              <motion.div
                layoutId="selector"
                className="absolute inset-0 border-2 border-primary rounded-lg"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Selected disaster details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDisaster.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="glassmorphic-card p-8"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left side - Visual */}
            <div className="relative">
              <div className={`
                absolute inset-0 bg-gradient-to-br ${selectedDisaster.color} opacity-10 rounded-lg
              `} />
              
              <div className="relative z-10 p-8 text-center">
                <div className={`
                  w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r ${selectedDisaster.color}
                  flex items-center justify-center animate-pulse
                `}>
                  <selectedDisaster.icon className="w-16 h-16 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{selectedDisaster.name}</h3>
                <p className="text-lg text-muted-foreground mb-4">{selectedDisaster.stats}</p>
                
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <Zap className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-500">{selectedDisaster.tip}</p>
                </div>
              </div>
            </div>

            {/* Right side - Documents needed */}
            <div>
              <h4 className="text-xl font-semibold mb-4">Critical Documents You'll Need</h4>
              
              <div className="space-y-3">
                {selectedDisaster.documents.map((doc, index) => (
                  <motion.div
                    key={doc.type}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4 p-4 bg-background/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Home className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold mb-1">{doc.type}</h5>
                      <p className="text-sm text-muted-foreground">{doc.reason}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20"
              >
                <p className="text-sm">
                  <span className="font-semibold">Pro tip:</span> Upload these documents now. 
                  During a disaster, internet and power may be unavailable.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}