'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { apiService } from '@/services/api'
import { ArrowLeft, ArrowRight, CheckCircle, Rocket } from 'lucide-react'

const totalSteps = 5

export default function PilotApplication({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    whyPilot: '',
    biggestChallenge: '',
    hoursPerWeek: 0,
    commitFeedback: '',
    feedbackExplanation: '',
    linkedinUrl: '',
    twitterHandle: '',
    websiteUrl: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.whyPilot || formData.whyPilot.length < 500) {
          newErrors.whyPilot = 'Please write at least 500 characters about why you want to be a pilot member'
        }
        break
      case 2:
        if (!formData.biggestChallenge) {
          newErrors.biggestChallenge = 'Please describe your biggest life management challenge'
        }
        break
      case 3:
        if (!formData.hoursPerWeek || formData.hoursPerWeek < 1) {
          newErrors.hoursPerWeek = 'Please enter the number of hours per week'
        }
        break
      case 4:
        if (!formData.commitFeedback) {
          newErrors.commitFeedback = 'Please select whether you can commit to weekly feedback'
        }
        if (formData.commitFeedback === 'no' && !formData.feedbackExplanation) {
          newErrors.feedbackExplanation = 'Please explain why you cannot commit to weekly feedback'
        }
        break
      case 5:
        // Social proof is optional, but validate URLs if provided
        if (formData.linkedinUrl && !isValidUrl(formData.linkedinUrl)) {
          newErrors.linkedinUrl = 'Please enter a valid LinkedIn URL'
        }
        if (formData.websiteUrl && !isValidUrl(formData.websiteUrl)) {
          newErrors.websiteUrl = 'Please enter a valid website URL'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const nextStep = () => {
    if (validateStep()) {
      if (step < totalSteps) {
        setStep(prev => prev + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep()) return

    setIsSubmitting(true)
    const result = await apiService.applyForPilot({
      whyPilot: formData.whyPilot,
      biggestChallenge: formData.biggestChallenge,
      hoursPerWeek: parseInt(formData.hoursPerWeek.toString()),
      commitFeedback: formData.commitFeedback === 'yes',
      feedbackExplanation: formData.feedbackExplanation || undefined,
      linkedinUrl: formData.linkedinUrl || undefined,
      twitterHandle: formData.twitterHandle || undefined,
      websiteUrl: formData.websiteUrl || undefined,
    })

    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: 'Application Submitted! 🎉',
        description: "We'll review your application within 48 hours.",
        variant: 'default',
      })
      onComplete()
    } else {
      toast({
        title: 'Submission Failed',
        description: result.error || 'Please try again later.',
        variant: 'destructive',
      })
    }
  }

  const progress = (step / totalSteps) * 100

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-2xl mx-auto glassmorphic-card shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold gradient-text">
            Apply for Pilot Program
          </CardTitle>
          <CardDescription>
            Step {step} of {totalSteps}: {
              step === 1 ? "Your Motivation" :
              step === 2 ? "Your Challenges" :
              step === 3 ? "Time Commitment" :
              step === 4 ? "Feedback Commitment" :
              "Social Proof"
            }
          </CardDescription>
          <Progress value={progress} className="w-full mt-4 h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Label htmlFor="whyPilot">
                Why do you want to be a pilot member? (minimum 500 characters)
              </Label>
              <Textarea
                id="whyPilot"
                name="whyPilot"
                value={formData.whyPilot}
                onChange={handleInputChange}
                placeholder="Tell us about your motivation for joining the pilot program..."
                className={`min-h-[200px] ${errors.whyPilot ? 'border-destructive' : ''}`}
              />
              <div className="text-sm text-muted-foreground">
                {formData.whyPilot.length} / 500 characters
              </div>
              {errors.whyPilot && (
                <p className="text-sm text-destructive">{errors.whyPilot}</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label htmlFor="biggestChallenge">
                What's your biggest life management challenge?
              </Label>
              <Textarea
                id="biggestChallenge"
                name="biggestChallenge"
                value={formData.biggestChallenge}
                onChange={handleInputChange}
                placeholder="Describe the main challenges you face in managing your life, finances, career, etc..."
                className={`min-h-[150px] ${errors.biggestChallenge ? 'border-destructive' : ''}`}
              />
              {errors.biggestChallenge && (
                <p className="text-sm text-destructive">{errors.biggestChallenge}</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label htmlFor="hoursPerWeek">
                How many hours per week do you spend managing finances and life admin?
              </Label>
              <Input
                id="hoursPerWeek"
                name="hoursPerWeek"
                type="number"
                min="0"
                value={formData.hoursPerWeek}
                onChange={handleInputChange}
                placeholder="Enter number of hours"
                className={errors.hoursPerWeek ? 'border-destructive' : ''}
              />
              {errors.hoursPerWeek && (
                <p className="text-sm text-destructive">{errors.hoursPerWeek}</p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Label>Will you commit to providing weekly feedback?</Label>
              <RadioGroup
                value={formData.commitFeedback}
                onValueChange={(value) => setFormData(prev => ({ ...prev, commitFeedback: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes">Yes, I commit to weekly feedback</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no">No, I cannot commit to weekly feedback</Label>
                </div>
              </RadioGroup>
              {errors.commitFeedback && (
                <p className="text-sm text-destructive">{errors.commitFeedback}</p>
              )}

              {formData.commitFeedback === 'no' && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="feedbackExplanation">
                    Please explain why you cannot commit to weekly feedback:
                  </Label>
                  <Textarea
                    id="feedbackExplanation"
                    name="feedbackExplanation"
                    value={formData.feedbackExplanation}
                    onChange={handleInputChange}
                    placeholder="Your explanation..."
                    className={errors.feedbackExplanation ? 'border-destructive' : ''}
                  />
                  {errors.feedbackExplanation && (
                    <p className="text-sm text-destructive">{errors.feedbackExplanation}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Optional: Share your social profiles to strengthen your application
              </p>
              
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className={errors.linkedinUrl ? 'border-destructive' : ''}
                />
                {errors.linkedinUrl && (
                  <p className="text-sm text-destructive">{errors.linkedinUrl}</p>
                )}
              </div>

              <div>
                <Label htmlFor="twitterHandle">Twitter/X Handle</Label>
                <Input
                  id="twitterHandle"
                  name="twitterHandle"
                  value={formData.twitterHandle}
                  onChange={handleInputChange}
                  placeholder="@yourhandle"
                />
              </div>

              <div>
                <Label htmlFor="websiteUrl">Personal Website</Label>
                <Input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                  className={errors.websiteUrl ? 'border-destructive' : ''}
                />
                {errors.websiteUrl && (
                  <p className="text-sm text-destructive">{errors.websiteUrl}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-6 gap-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className="flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <Button
            onClick={nextStep}
            disabled={isSubmitting}
            className="bg-primary-gradient hover:opacity-90 transition-opacity duration-300 text-primary-foreground font-semibold flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>{step === totalSteps ? 'Submit Application' : 'Next Step'}</span>
                {step === totalSteps ? <Rocket className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}