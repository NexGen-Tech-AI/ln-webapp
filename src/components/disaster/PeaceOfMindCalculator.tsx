'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Clock, AlertCircle, CheckCircle, TrendingUp, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PeaceOfMindCalculator() {
  const [selections, setSelections] = useState({
    propertyValue: 350000,
    monthlyIncome: 5000,
    familySize: 4,
    hasBusinessDocs: false,
    hasMedicalNeeds: false
  })

  const [showResults, setShowResults] = useState(false)

  // Calculate potential losses and time costs
  const calculateImpact = () => {
    let timeLost = 0
    let moneyAtRisk = 0
    let stressFactor = 0

    // Property documentation delays
    if (selections.propertyValue > 0) {
      timeLost += 45 // days to prove ownership
      moneyAtRisk += selections.propertyValue * 0.1 // 10% at risk without proper docs
      stressFactor += 3
    }

    // Income disruption
    const monthlyLoss = selections.monthlyIncome
    timeLost += 30 // days to get FEMA assistance without docs
    moneyAtRisk += monthlyLoss * 3 // 3 months typical delay
    stressFactor += 2

    // Family impact
    timeLost += selections.familySize * 5 // days per family member for ID replacement
    stressFactor += selections.familySize

    // Business impact
    if (selections.hasBusinessDocs) {
      timeLost += 90 // business recovery time
      moneyAtRisk += monthlyLoss * 6 // 6 months business disruption
      stressFactor += 5
    }

    // Medical needs
    if (selections.hasMedicalNeeds) {
      timeLost += 14 // critical care disruption
      moneyAtRisk += 10000 // medical costs
      stressFactor += 4
    }

    return { timeLost, moneyAtRisk, stressFactor }
  }

  const { timeLost, moneyAtRisk, stressFactor } = calculateImpact()
  const monthlyValue = Math.max(20, Math.round((moneyAtRisk / 12) * 0.01)) // Your peace of mind worth
  const proTierMonthly = 20 // Pro Navigator tier price
  const dailyCost = ((proTierMonthly * 12) / 365).toFixed(2) // Actual daily cost for Pro tier

  return (
    <div className="max-w-4xl mx-auto">
      {!showResults ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glassmorphic-card p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-primary" />
            <h3 className="text-2xl font-bold">Calculate Your Risk</h3>
          </div>

          <div className="space-y-6">
            {/* Property Value */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Property Value
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xl text-muted-foreground">$</span>
                <input
                  type="number"
                  value={selections.propertyValue}
                  onChange={(e) => setSelections({ ...selections, propertyValue: Number(e.target.value) })}
                  className="flex-1 px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:outline-none"
                  placeholder="350000"
                />
              </div>
            </div>

            {/* Monthly Income */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Monthly Income
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xl text-muted-foreground">$</span>
                <input
                  type="number"
                  value={selections.monthlyIncome}
                  onChange={(e) => setSelections({ ...selections, monthlyIncome: Number(e.target.value) })}
                  className="flex-1 px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:outline-none"
                  placeholder="5000"
                />
              </div>
            </div>

            {/* Family Size */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Family Members
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelections({ ...selections, familySize: num })}
                    className={`
                      py-2 rounded-lg border transition-all
                      ${selections.familySize === num
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    {num}{num === 5 && '+'}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Factors */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selections.hasBusinessDocs}
                  onChange={(e) => setSelections({ ...selections, hasBusinessDocs: e.target.checked })}
                  className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                />
                <span>I own a business</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selections.hasMedicalNeeds}
                  onChange={(e) => setSelections({ ...selections, hasMedicalNeeds: e.target.checked })}
                  className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                />
                <span>Family members have ongoing medical needs</span>
              </label>
            </div>

            <button
              className="w-full bg-primary-gradient text-primary-foreground text-lg py-6 rounded-md hover:opacity-90 transition-opacity"
              onClick={() => setShowResults(true)}
            >
              Calculate My Peace of Mind Value
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Results Header */}
          <div className="glassmorphic-card p-8 text-center">
            <h3 className="text-3xl font-bold mb-2">Your Disaster Risk Analysis</h3>
            <p className="text-muted-foreground">Without document protection, here's what you're risking:</p>
          </div>

          {/* Risk Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glassmorphic-card p-6 border-red-500/30"
            >
              <Clock className="w-8 h-8 text-red-500 mb-3" />
              <h4 className="text-4xl font-bold text-red-500 mb-2">{timeLost}</h4>
              <p className="font-semibold">Days Lost</p>
              <p className="text-sm text-muted-foreground mt-2">
                Time spent proving identity, ownership, and eligibility
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glassmorphic-card p-6 border-orange-500/30"
            >
              <DollarSign className="w-8 h-8 text-orange-500 mb-3" />
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl text-orange-500">$</span>
                <h4 className="text-4xl font-bold text-orange-500">{moneyAtRisk.toLocaleString()}</h4>
              </div>
              <p className="font-semibold">At Risk</p>
              <p className="text-sm text-muted-foreground mt-2">
                Potential financial impact from delays and lost documents
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glassmorphic-card p-6 border-purple-500/30"
            >
              <AlertCircle className="w-8 h-8 text-purple-500 mb-3" />
              <h4 className="text-4xl font-bold text-purple-500 mb-2">{stressFactor}x</h4>
              <p className="font-semibold">Stress Level</p>
              <p className="text-sm text-muted-foreground mt-2">
                Multiplied stress during already difficult times
              </p>
            </motion.div>
          </div>

          {/* Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glassmorphic-card p-8 border-primary/30"
          >
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Your Peace of Mind is Worth</h3>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-3xl gradient-text">$</span>
                <span className="text-5xl font-bold gradient-text">{monthlyValue}</span>
                <span className="text-2xl gradient-text">/month</span>
              </div>
              <p className="text-muted-foreground">
                Only ${dailyCost} per day to protect everything
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                *Based on Pro Navigator tier ($20/month)
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Instant Recovery</p>
                  <p className="text-sm text-muted-foreground">Start rebuilding immediately, not months later</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Financial Protection</p>
                  <p className="text-sm text-muted-foreground">Avoid <span className="font-semibold">${moneyAtRisk.toLocaleString()}</span> in potential losses</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Family Security</p>
                  <p className="text-sm text-muted-foreground">Keep your family safe and stress-free</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Business Continuity</p>
                  <p className="text-sm text-muted-foreground">Keep earning even during disasters</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowResults(false)}
                className="flex-1 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
              >
                Recalculate
              </button>
              <button className="flex-1 px-4 py-2 bg-primary-gradient text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
                Protect My Documents Now
              </button>
            </div>
          </motion.div>

          {/* Comparison */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glassmorphic-card p-6"
          >
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Compare to everyday expenses:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{Math.round(monthlyValue / 15)}</p>
                <p className="text-sm text-muted-foreground">Starbucks coffees</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(monthlyValue / 50)}</p>
                <p className="text-sm text-muted-foreground">Netflix subscriptions</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(monthlyValue / 100)}</p>
                <p className="text-sm text-muted-foreground">Gym memberships</p>
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Dinner out</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}