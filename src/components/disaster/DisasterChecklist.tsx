'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

const checklistItems = [
  {
    category: 'Essential Documents',
    items: [
      { id: 'birth-cert', label: 'Birth Certificates', critical: true },
      { id: 'passport', label: 'Passports/IDs', critical: true },
      { id: 'insurance', label: 'Insurance Policies', critical: true },
      { id: 'medical', label: 'Medical Records', critical: true },
      { id: 'property', label: 'Property Deeds', critical: true },
      { id: 'tax', label: 'Tax Returns (3 years)', critical: false },
      { id: 'bank', label: 'Bank Statements', critical: false },
      { id: 'will', label: 'Will/Legal Documents', critical: true }
    ]
  },
  {
    category: 'Financial Security',
    items: [
      { id: 'credit-cards', label: 'Credit Card Info', critical: false },
      { id: 'investments', label: 'Investment Records', critical: false },
      { id: 'retirement', label: 'Retirement Accounts', critical: false },
      { id: 'crypto', label: 'Crypto Wallet Backups', critical: false },
      { id: 'debts', label: 'Debt Documentation', critical: false }
    ]
  },
  {
    category: 'Personal & Sentimental',
    items: [
      { id: 'photos', label: 'Family Photos', critical: false },
      { id: 'videos', label: 'Home Videos', critical: false },
      { id: 'heirlooms', label: 'Digital Heirlooms', critical: false },
      { id: 'contacts', label: 'Emergency Contacts', critical: true }
    ]
  }
]

export default function DisasterChecklist() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [showUnchecked, setShowUnchecked] = useState(false)

  const toggleItem = (id: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedItems(newChecked)
  }

  const totalItems = checklistItems.reduce((acc, cat) => acc + cat.items.length, 0)
  const criticalItems = checklistItems.reduce(
    (acc, cat) => acc + cat.items.filter(item => item.critical).length,
    0
  )
  const checkedCritical = checklistItems.reduce(
    (acc, cat) => acc + cat.items.filter(item => item.critical && checkedItems.has(item.id)).length,
    0
  )

  const readinessScore = Math.round((checkedItems.size / totalItems) * 100)
  const criticalScore = Math.round((checkedCritical / criticalItems) * 100)

  const uncheckedCritical = checklistItems
    .flatMap(cat => cat.items)
    .filter(item => item.critical && !checkedItems.has(item.id))

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glassmorphic-card p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold mb-4">Overall Readiness</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Documents Protected</span>
              <span className="font-semibold">{checkedItems.size}/{totalItems}</span>
            </div>
            <Progress value={readinessScore} className="h-3" />
            <p className="text-2xl font-bold gradient-text">{readinessScore}% Ready</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glassmorphic-card p-6"
        >
          <h3 className="text-base sm:text-lg font-semibold mb-4">Critical Risk Level</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Critical Items At Risk</span>
              <span className="font-semibold">{criticalItems - checkedCritical}/{criticalItems}</span>
            </div>
            <Progress 
              value={100 - criticalScore} 
              className={`h-3 ${100 - criticalScore > 0 ? '[&>div]:bg-orange-500' : '[&>div]:bg-green-500'}`}
            />
            <p className="text-2xl font-bold">
              {100 - criticalScore > 0 ? (
                <span className="text-orange-500">{100 - criticalScore}% At Risk</span>
              ) : (
                <span className="text-green-500">0% Risk - Fully Protected!</span>
              )}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Warning for unchecked critical items */}
      {uncheckedCritical.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-500 mb-1">Critical Documents Missing!</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                These documents are essential for FEMA claims and disaster recovery:
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {uncheckedCritical.map(item => (
                  <span
                    key={item.id}
                    className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-500/20 rounded-full cursor-pointer hover:bg-orange-500/30"
                    onClick={() => toggleItem(item.id)}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Checklist */}
      <div className="space-y-8">
        {checklistItems.map((category, categoryIndex) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: categoryIndex * 0.1 }}
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {category.category}
              <span className="text-sm font-normal text-muted-foreground">
                ({category.items.filter(item => checkedItems.has(item.id)).length}/{category.items.length})
              </span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {category.items.map((item, itemIndex) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: categoryIndex * 0.1 + itemIndex * 0.05 }}
                  className={`
                    relative group cursor-pointer
                    ${!showUnchecked && !checkedItems.has(item.id) ? 'opacity-50' : ''}
                  `}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className={`
                    flex items-center gap-3 p-4 rounded-lg border transition-all
                    ${checkedItems.has(item.id)
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-background/50 border-border hover:border-primary/50'
                    }
                  `}>
                    <div className={`
                      w-5 h-5 rounded flex items-center justify-center transition-all
                      ${checkedItems.has(item.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border border-border'
                      }
                    `}>
                      {checkedItems.has(item.id) && <Check className="w-3 h-3" />}
                    </div>
                    
                    <div className="flex-1">
                      <p className={`font-medium ${checkedItems.has(item.id) ? 'text-primary' : ''}`}>
                        {item.label}
                      </p>
                    </div>
                    
                    {item.critical && (
                      <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full">
                        Critical
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-8 text-center"
      >
        <p className="text-muted-foreground mb-4">
          {readinessScore < 100 ? (
            <>You're {100 - readinessScore}% away from complete disaster preparedness</>
          ) : (
            <>Congratulations! You're fully prepared for any emergency</>
          )}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => setShowUnchecked(!showUnchecked)}
          >
            {showUnchecked ? 'Hide' : 'Show'} Unchecked Items
          </Button>
          
          {readinessScore < 100 && (
            <Button className="bg-primary-gradient">
              Upload Missing Documents
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}