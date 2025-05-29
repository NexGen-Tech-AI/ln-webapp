'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Camera, Upload, FolderOpen, Shield, CheckCircle, ArrowRight, Smartphone, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const steps = [
  {
    id: 1,
    title: 'Grab Your Documents',
    time: '2 minutes',
    icon: FolderOpen,
    tasks: [
      'Birth certificates & passports',
      'Insurance policies (home, auto, health)',
      'Property deeds & mortgage docs',
      'Recent tax returns',
      'Bank & investment statements'
    ],
    tip: 'Don\'t have everything? Start with what you have - you can add more later.'
  },
  {
    id: 2,
    title: 'Snap or Scan',
    time: '5 minutes',
    icon: Camera,
    tasks: [
      'Use your phone camera or scanner',
      'AI auto-enhances image quality',
      'Both sides of documents if needed',
      'Include all pages of multi-page docs',
      'Photos of valuable items for insurance'
    ],
    tip: 'Our AI will automatically crop, enhance, and categorize your documents.'
  },
  {
    id: 3,
    title: 'Upload & Organize',
    time: '2 minutes',
    icon: Upload,
    tasks: [
      'Drag & drop or select files',
      'AI categorizes automatically',
      'Add custom tags if desired',
      'Set sharing permissions',
      'Enable emergency access'
    ],
    tip: 'Upload in any order - our AI sorts everything into the right categories.'
  },
  {
    id: 4,
    title: 'Secure & Verify',
    time: '1 minute',
    icon: Shield,
    tasks: [
      'Documents encrypted instantly',
      'Verify emergency contacts',
      'Test download feature',
      'Set up mobile app',
      'Enable offline access'
    ],
    tip: 'Your documents are now safer than in any physical safe or bank.'
  }
]

export default function QuickStartGuide() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const toggleStep = (stepId: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId)
    } else {
      newCompleted.add(stepId)
    }
    setCompletedSteps(newCompleted)
  }

  const totalTime = steps.reduce((acc, step) => acc + parseInt(step.time), 0)
  const progress = (completedSteps.size / steps.length) * 100

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glassmorphic-card p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">Total Time: {totalTime} minutes</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold gradient-text">{Math.round(progress)}%</p>
            <p className="text-sm text-muted-foreground">Complete</p>
          </div>
        </div>
        <Progress value={progress} className="h-3" />
      </motion.div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`
              glassmorphic-card p-6 cursor-pointer transition-all
              ${completedSteps.has(step.id) ? 'border-green-500/50' : ''}
              ${currentStep === index ? 'border-primary/50' : ''}
            `}
            onClick={() => setCurrentStep(index)}
          >
            <div className="flex items-start gap-4">
              {/* Step number and icon */}
              <div className="flex-shrink-0">
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center transition-all
                  ${completedSteps.has(step.id)
                    ? 'bg-green-500 text-white'
                    : currentStep === index
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {completedSteps.has(step.id) ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : (
                    <step.icon className="w-8 h-8" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xl font-semibold">{step.title}</h4>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {step.time}
                  </span>
                </div>

                {currentStep === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-2 mb-4">
                      {step.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-sm">{task}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-primary/5 rounded-lg mb-4">
                      <p className="text-sm flex items-start gap-2">
                        <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span><strong>Pro tip:</strong> {step.tip}</span>
                      </p>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStep(step.id)
                      }}
                      className={completedSteps.has(step.id) ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {completedSteps.has(step.id) ? 'Completed' : 'Mark as Complete'}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mobile app promotion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 glassmorphic-card p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">Even Faster with Our Mobile App</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Scan documents directly with your camera</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Auto-upload new documents as you get them</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Access everything offline during emergencies</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Face ID/Touch ID for instant secure access</span>
              </li>
            </ul>
            
            <div className="flex gap-4">
              <Button className="bg-black text-white hover:bg-gray-800">
                <Smartphone className="w-4 h-4 mr-2" />
                Download for iOS
              </Button>
              <Button className="bg-green-600 text-white hover:bg-green-700">
                <Smartphone className="w-4 h-4 mr-2" />
                Download for Android
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <div className="inline-block p-8 bg-background/50 rounded-2xl">
              <Smartphone className="w-32 h-32 text-primary mx-auto" />
              <p className="mt-4 text-sm text-muted-foreground">Scan to download</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Completion celebration */}
      {completedSteps.size === steps.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 text-center p-8 glassmorphic-card border-green-500/50"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-2">Congratulations! You're Protected!</h3>
          <p className="text-xl text-muted-foreground mb-6">
            Your documents are now safe from any disaster
          </p>
          <Button className="bg-primary-gradient text-lg px-8 py-6">
            Access Your Secure Vault
          </Button>
        </motion.div>
      )}
    </div>
  )
}