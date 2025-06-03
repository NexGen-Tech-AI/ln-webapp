'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Checkbox } from '@/components/ui/checkbox';
    import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
    import { Progress } from '@/components/ui/progress';
    import { useToast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/AuthContext';
    import { ArrowLeft, ArrowRight, PartyPopper, DollarSign, TrendingUp, Briefcase, Target, Heart, BookOpen, ShieldCheck, Calculator, Building, Brain } from 'lucide-react';

    const lifeDomains = [
      { id: 'financial_planning', label: '💰 Financial Planning & Wealth Building', icon: <DollarSign className="w-5 h-5 mr-2" /> },
      { id: 'investment_management', label: '📈 Investment & Portfolio Management', icon: <TrendingUp className="w-5 h-5 mr-2" /> },
      { id: 'career_development', label: '💼 Career Development & Networking', icon: <Briefcase className="w-5 h-5 mr-2" /> },
      { id: 'goal_setting', label: '🎯 Goal Setting & Achievement Tracking', icon: <Target className="w-5 h-5 mr-2" /> },
      { id: 'health_wellness', label: '🏥 Health & Wellness Management', icon: <Heart className="w-5 h-5 mr-2" /> },
      { id: 'education_skills', label: '📚 Education & Skill Development', icon: <BookOpen className="w-5 h-5 mr-2" /> },
      { id: 'document_security', label: '📄 Document Vault & Security', icon: <ShieldCheck className="w-5 h-5 mr-2" /> },
      { id: 'tax_strategy', label: '🧮 Tax Strategy & Optimization', icon: <Calculator className="w-5 h-5 mr-2" /> },
      { id: 'business_expenses', label: '🏢 Business Expense Tracking', icon: <Building className="w-5 h-5 mr-2" /> },
      { id: 'life_balance_mental_health', label: '🧘 Life Balance & Mental Health', icon: <Brain className="w-5 h-5 mr-2" /> },
    ];

    const tiersList = [
      { id: 'free', name: 'Free Navigator', price: '$0/mo', features: ['Core dashboard', 'Community access', 'Basic goal tracking'] },
      { id: 'pro', name: 'Pro Navigator', price: '$20/mo', features: ['Advanced analytics', 'Domain-specific tools', 'Priority support', 'All Free features'] },
      { id: 'ai', name: 'AI Navigator+', price: '$99/mo', features: ['AI life coach', 'Predictive insights', 'Automated planning', 'All Pro features'] },
      { id: 'family', name: 'Family Navigator', price: '$35/mo', features: ['Up to 5 members', 'Shared domain views', 'Collaborative goals', 'All Pro features'] },
    ];

    const totalSteps = 5;

    const SignupPage = () => {
      const [step, setStep] = useState(1);
      const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        profession: '',
        company: '',
        interests: [], // Will store full labels now
        tierPreference: 'free',
        referralCode: '',
      });
      const [errors, setErrors] = useState({});
      const { toast } = useToast();
      const router = useRouter();
      const { signup } = useAuth();

      // Check for referral code in localStorage on mount
      useEffect(() => {
        const savedReferralCode = localStorage.getItem('referralCode');
        if (savedReferralCode) {
          setFormData(prev => ({ ...prev, referralCode: savedReferralCode }));
        }
      }, []);

      const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
          setErrors(prev => ({...prev, [name]: null}));
        }
      };

      const handleCheckboxChange = (interestLabel) => {
        setFormData((prev) => ({
          ...prev,
          interests: prev.interests.includes(interestLabel)
            ? prev.interests.filter((i) => i !== interestLabel)
            : [...prev.interests, interestLabel],
        }));
         if (errors.interests) {
          setErrors(prev => ({...prev, interests: null}));
        }
      };
      
      const validateStep = () => {
        const newErrors = {};
        if (step === 1) {
          if (!formData.email) newErrors.email = 'Email is required';
          else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
          if (!formData.password) newErrors.password = 'Password is required';
          else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
          if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        } else if (step === 2) {
          if (!formData.name) newErrors.name = 'Name is required';
        } else if (step === 3) {
          if (formData.interests.length === 0) newErrors.interests = 'Please select at least one life domain';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      };

      const nextStep = () => {
        if (validateStep()) {
          // Track form step progression
          if (window.analytics) {
            window.analytics.trackFormStep(step + 1);
          }
          
          if (step < totalSteps) {
            setStep((prev) => prev + 1);
          } else {
            handleSubmit();
          }
        }
      };

      const prevStep = () => {
        if (step > 1) {
          setStep((prev) => prev - 1);
        }
      };

      const handleSubmit = async () => {
        if (!validateStep()) return; 

        const result = await signup(formData);
        
        if (result.success) {
          // Track successful signup conversion
          if (window.analytics) {
            window.analytics.trackFormComplete();
            window.analytics.trackConversion('signup');
          }
          
          toast({
            title: 'Welcome to the LifeNavigator Waitlist! 🧭',
            description: `You're all set, ${formData.name}! Get ready to navigate your empire.`,
            variant: 'default',
            duration: 5000,
          });
          router.push('/dashboard');
        } else {
          // Track form abandonment
          if (window.analytics) {
            window.analytics.trackFormAbandon(step, result.error);
          }
          
          toast({
            title: 'Signup failed',
            description: result.error || 'An error occurred. Please try again.',
            variant: 'destructive',
            duration: 5000,
          });
        }
      };
      
      const progress = (step / totalSteps) * 100;

      const pageVariants = {
        initial: { opacity: 0, x: 50 },
        in: { opacity: 1, x: 0 },
        out: { opacity: 0, x: -50 }
      };
    
      const pageTransition = {
        type: "tween",
        ease: "anticipate",
        duration: 0.4
      };

      return (
        <motion.div 
          key={step}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex justify-center items-center min-h-screen"
        >
          <Card className="w-full max-w-2xl glassmorphic-card shadow-2xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold gradient-text text-center">
                Chart Your Course with LifeNavigator!
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Step {step} of {totalSteps}: {
                  step === 1 ? "Secure Your Account" :
                  step === 2 ? "Introduce Yourself" :
                  step === 3 ? "Select Your Life Domains" :
                  step === 4 ? "Choose Your Navigator Tier" :
                  "Optional Referral Code"
                }
              </CardDescription>
              <Progress value={progress} className="w-full mt-4 h-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="you@empire.com" className={errors.email ? 'border-destructive' : ''}/>
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="password">Create Password</Label>
                    <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Min. 8 characters, strong & memorable" className={errors.password ? 'border-destructive' : ''}/>
                    {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Re-enter your password" className={errors.confirmPassword ? 'border-destructive' : ''}/>
                    {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
                  </div>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Alex Navigator" className={errors.name ? 'border-destructive' : ''}/>
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="profession">Primary Profession (Optional)</Label>
                    <Input id="profession" name="profession" value={formData.profession} onChange={handleInputChange} placeholder="e.g., Founder, Investor, Creator"/>
                  </div>
                  <div>
                    <Label htmlFor="company">Company / Main Venture (Optional)</Label>
                    <Input id="company" name="company" value={formData.company} onChange={handleInputChange} placeholder="e.g., Navigator Holdings"/>
                  </div>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Label>Which life domains are your current focus? (Select all that apply)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                    {lifeDomains.map((domain) => (
                      <div key={domain.id} className="flex items-center space-x-2 p-3 rounded-md border border-input hover:border-primary transition-colors bg-background/50">
                        <Checkbox
                          id={domain.id}
                          checked={formData.interests.includes(domain.label)}
                          onCheckedChange={() => handleCheckboxChange(domain.label)}
                        />
                        {domain.icon}
                        <Label htmlFor={domain.id} className="font-normal cursor-pointer text-xs sm:text-sm">{domain.label.substring(2)}</Label>
                      </div>
                    ))}
                  </div>
                  {errors.interests && <p className="text-sm text-destructive mt-1">{errors.interests}</p>}
                </motion.div>
              )}
              {step === 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Label>Choose your preferred Navigator Tier (you can change this later)</Label>
                  <RadioGroup
                    value={formData.tierPreference}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tierPreference: value }))}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {tiersList.map((tier) => (
                      <Label
                        key={tier.id}
                        htmlFor={tier.id}
                        className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all ${formData.tierPreference === tier.id ? 'border-primary ring-2 ring-primary shadow-lg bg-primary/10' : 'border-input hover:border-muted-foreground/50 bg-background/50'}`}
                      >
                        <div className="flex items-center justify-between">
                           <div className="flex items-center">
                            <RadioGroupItem value={tier.id} id={tier.id} className="mr-3" />
                            <span className="font-semibold text-lg">{tier.name}</span>
                           </div>
                           <span className="text-primary font-bold">{tier.price}</span>
                        </div>
                        <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside pl-2 space-y-1">
                            {tier.features.map((feature, idx) => <li key={idx}>{feature}</li>)}
                        </ul>
                      </Label>
                    ))}
                  </RadioGroup>
                </motion.div>
              )}
              {step === 5 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div>
                    <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                    <Input id="referralCode" name="referralCode" value={formData.referralCode} onChange={handleInputChange} placeholder="Enter if you have one"/>
                    <p className="text-xs text-muted-foreground mt-1">Know another Navigator? Using their code gives them a boost up the waitlist!</p>
                  </div>
                </motion.div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-6">
              <Button variant="outline" onClick={prevStep} disabled={step === 1} className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4"/> 
                <span>Previous</span>
              </Button>
              <Button onClick={nextStep} className="bg-primary-gradient hover:opacity-90 transition-opacity duration-300 text-primary-foreground font-semibold flex items-center space-x-2">
                <span>{step === totalSteps ? 'Complete & Join Waitlist' : 'Next Step'}</span>
                {step === totalSteps ? <PartyPopper className="w-4 h-4"/> : <ArrowRight className="w-4 h-4"/>}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      );
    };

    export default SignupPage;