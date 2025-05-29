'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/components/ui/use-toast'
import { apiService } from '@/services/api'
import { Building2, Users, Code, Shield, CreditCard, BarChart3, Send } from 'lucide-react'

const partnershipTypes = [
  { id: 'whitelabel', label: 'White-label Solution', icon: Building2 },
  { id: 'employee', label: 'Employee Benefits Program', icon: Users },
  { id: 'api', label: 'API Integration', icon: Code },
  { id: 'insurance', label: 'Insurance Partnership', icon: Shield },
  { id: 'financial', label: 'Financial Institution Integration', icon: CreditCard },
  { id: 'analytics', label: 'Analytics & Insights Partnership', icon: BarChart3 },
]

const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
]

const revenueRanges = [
  { value: '<1M', label: 'Less than $1M' },
  { value: '1M-10M', label: '$1M - $10M' },
  { value: '10M-50M', label: '$10M - $50M' },
  { value: '50M-100M', label: '$50M - $100M' },
  { value: '100M+', label: '$100M+' },
]

export default function PartnershipPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    industry: '',
    contactName: '',
    contactRole: '',
    contactEmail: '',
    contactPhone: '',
    companySize: '',
    revenueRange: '',
    partnershipTypes: [] as string[],
    proposal: '',
    expectedVolume: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCheckboxChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      partnershipTypes: prev.partnershipTypes.includes(type)
        ? prev.partnershipTypes.filter(t => t !== type)
        : [...prev.partnershipTypes, type]
    }))
    if (errors.partnershipTypes) {
      setErrors(prev => ({ ...prev, partnershipTypes: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.companyName) newErrors.companyName = 'Company name is required'
    if (!formData.website) newErrors.website = 'Website is required'
    else if (!/^https?:\/\/.+/.test(formData.website)) newErrors.website = 'Please enter a valid URL'
    if (!formData.industry) newErrors.industry = 'Industry is required'
    if (!formData.contactName) newErrors.contactName = 'Contact name is required'
    if (!formData.contactRole) newErrors.contactRole = 'Contact role is required'
    if (!formData.contactEmail) newErrors.contactEmail = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) newErrors.contactEmail = 'Invalid email address'
    if (!formData.companySize) newErrors.companySize = 'Company size is required'
    if (formData.partnershipTypes.length === 0) newErrors.partnershipTypes = 'Please select at least one partnership type'
    if (!formData.proposal) newErrors.proposal = 'Proposal is required'
    else if (formData.proposal.length > 1000) newErrors.proposal = 'Proposal must be under 1000 characters'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    const result = await apiService.submitPartnership(formData)
    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: 'Partnership Request Submitted! 🤝',
        description: 'Our partnerships team will contact you within 3 business days.',
        variant: 'default',
      })
      // Reset form
      setFormData({
        companyName: '',
        website: '',
        industry: '',
        contactName: '',
        contactRole: '',
        contactEmail: '',
        contactPhone: '',
        companySize: '',
        revenueRange: '',
        partnershipTypes: [],
        proposal: '',
        expectedVolume: '',
      })
    } else {
      toast({
        title: 'Submission Failed',
        description: result.error || 'Please try again later.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Partnership Opportunities
          </h1>
          <p className="text-xl text-muted-foreground">
            Join us in revolutionizing life management for millions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="glassmorphic-card">
            <CardHeader>
              <CardTitle className="text-xl">Enterprise Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                White-label our platform for your organization or integrate via API
              </p>
            </CardContent>
          </Card>
          <Card className="glassmorphic-card">
            <CardHeader>
              <CardTitle className="text-xl">Employee Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Offer LifeNavigator as a premium benefit to your workforce
              </p>
            </CardContent>
          </Card>
          <Card className="glassmorphic-card">
            <CardHeader>
              <CardTitle className="text-xl">Strategic Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Seamlessly integrate your services with our ecosystem
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="glassmorphic-card shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl gradient-text">
              Partner Application Form
            </CardTitle>
            <CardDescription>
              Tell us about your company and partnership interests
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Acme Corporation"
                    className={errors.companyName ? 'border-destructive' : ''}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive mt-1">{errors.companyName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="website">Website *</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://yourcompany.com"
                    className={errors.website ? 'border-destructive' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive mt-1">{errors.website}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  placeholder="Financial Services, Healthcare, Technology, etc."
                  className={errors.industry ? 'border-destructive' : ''}
                />
                {errors.industry && (
                  <p className="text-sm text-destructive mt-1">{errors.industry}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={errors.contactName ? 'border-destructive' : ''}
                  />
                  {errors.contactName && (
                    <p className="text-sm text-destructive mt-1">{errors.contactName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contactRole">Contact Role *</Label>
                  <Input
                    id="contactRole"
                    name="contactRole"
                    value={formData.contactRole}
                    onChange={handleInputChange}
                    placeholder="VP of Partnerships"
                    className={errors.contactRole ? 'border-destructive' : ''}
                  />
                  {errors.contactRole && (
                    <p className="text-sm text-destructive mt-1">{errors.contactRole}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="john@company.com"
                    className={errors.contactEmail ? 'border-destructive' : ''}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-destructive mt-1">{errors.contactEmail}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Company Size *</Label>
                  <RadioGroup
                    value={formData.companySize}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, companySize: value }))}
                  >
                    {companySizes.map(size => (
                      <div key={size.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={size.value} id={size.value} />
                        <Label htmlFor={size.value} className="font-normal">{size.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.companySize && (
                    <p className="text-sm text-destructive mt-1">{errors.companySize}</p>
                  )}
                </div>
                <div>
                  <Label>Annual Revenue Range</Label>
                  <RadioGroup
                    value={formData.revenueRange}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, revenueRange: value }))}
                  >
                    {revenueRanges.map(range => (
                      <div key={range.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={range.value} id={range.value} />
                        <Label htmlFor={range.value} className="font-normal">{range.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div>
                <Label>Partnership Types Interested In *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {partnershipTypes.map(type => {
                    const Icon = type.icon
                    return (
                      <div
                        key={type.id}
                        className="flex items-center space-x-2 p-3 rounded-md border border-input hover:border-primary transition-colors"
                      >
                        <Checkbox
                          id={type.id}
                          checked={formData.partnershipTypes.includes(type.id)}
                          onCheckedChange={() => handleCheckboxChange(type.id)}
                        />
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor={type.id} className="font-normal cursor-pointer">
                          {type.label}
                        </Label>
                      </div>
                    )
                  })}
                </div>
                {errors.partnershipTypes && (
                  <p className="text-sm text-destructive mt-1">{errors.partnershipTypes}</p>
                )}
              </div>

              <div>
                <Label htmlFor="proposal">
                  Brief Partnership Proposal * (max 1000 characters)
                </Label>
                <Textarea
                  id="proposal"
                  name="proposal"
                  value={formData.proposal}
                  onChange={handleInputChange}
                  placeholder="Describe your partnership vision and how we can work together..."
                  className={`min-h-[150px] ${errors.proposal ? 'border-destructive' : ''}`}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.proposal.length} / 1000 characters
                </div>
                {errors.proposal && (
                  <p className="text-sm text-destructive">{errors.proposal}</p>
                )}
              </div>

              <div>
                <Label htmlFor="expectedVolume">Expected Volume/Users</Label>
                <Input
                  id="expectedVolume"
                  name="expectedVolume"
                  value={formData.expectedVolume}
                  onChange={handleInputChange}
                  placeholder="e.g., 5,000 employees, 10,000 monthly users"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-gradient hover:opacity-90 transition-opacity duration-300 text-primary-foreground font-semibold flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Partnership Request</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}