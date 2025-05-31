import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']
type PaymentMethod = Database['public']['Tables']['payment_methods']['Row']

export class ApiService {
  // Auth methods
  async signup(data: {
    email: string
    password: string
    name?: string
    profession?: string
    company?: string
    interests: string[]
    tierPreference: string
    referralCode?: string
  }) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) throw authError

      // Update user profile (the trigger should have created the user record)
      if (authData.user) {
        // Wait a moment for the trigger to create the user record
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { error: profileError } = await supabase
          .from('users')
          .update({
            name: data.name,
            profession: data.profession,
            company: data.company,
            interests: data.interests,
            tier_preference: data.tierPreference,
            referred_by: data.referralCode,
          })
          .eq('id', authData.user.id)

        if (profileError) {
          console.error('Profile update error:', profileError)
          // If update fails, try insert
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: data.email,
              name: data.name,
              profession: data.profession,
              company: data.company,
              interests: data.interests,
              tier_preference: data.tierPreference,
              referred_by: data.referralCode,
            })
          
          if (insertError) throw insertError
        }

        // Increment referral count if referral code was used
        if (data.referralCode) {
          await supabase.rpc('increment_referral_count', { 
            referral_code: data.referralCode 
          })
        }
      }

      return { success: true, user: authData.user }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Update last login
      if (data.user) {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id)
      }

      return { success: true, user: data.user, session: data.session }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async logout() {
    const { error } = await supabase.auth.signOut()
    return { success: !error, error: error?.message }
  }

  async refreshToken() {
    const { data, error } = await supabase.auth.refreshSession()
    return { success: !error, session: data.session, error: error?.message }
  }

  // User methods
  async getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      return { success: true, user: data }
    } catch (error) {
      console.error('Get profile error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async updateProfile(updates: Partial<User>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      return { success: true, user: data }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Pilot application methods
  async applyForPilot(application: {
    whyPilot: string
    biggestChallenge: string
    hoursPerWeek: number
    commitFeedback: boolean
    feedbackExplanation?: string
    linkedinUrl?: string
    twitterHandle?: string
    websiteUrl?: string
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('pilot_applications')
        .insert({
          user_id: user.id,
          why_pilot: application.whyPilot,
          biggest_challenge: application.biggestChallenge,
          hours_per_week: application.hoursPerWeek,
          commit_feedback: application.commitFeedback,
          feedback_explanation: application.feedbackExplanation,
          linkedin_url: application.linkedinUrl,
          twitter_handle: application.twitterHandle,
          website_url: application.websiteUrl,
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, application: data }
    } catch (error) {
      console.error('Pilot application error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async getPilotStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('pilot_applications')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return { success: true, application: data }
    } catch (error) {
      console.error('Get pilot status error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Partnership methods
  async submitPartnership(data: {
    companyName: string
    website: string
    industry: string
    contactName: string
    contactRole: string
    contactEmail: string
    contactPhone?: string
    companySize?: string
    revenueRange?: string
    partnershipTypes: string[]
    proposal: string
    expectedVolume?: string
  }) {
    try {
      const { data: result, error } = await supabase
        .from('partnership_requests')
        .insert({
          company_name: data.companyName,
          website: data.website,
          industry: data.industry,
          contact_name: data.contactName,
          contact_role: data.contactRole,
          contact_email: data.contactEmail,
          contact_phone: data.contactPhone,
          company_size: data.companySize,
          revenue_range: data.revenueRange,
          partnership_types: data.partnershipTypes,
          proposal: data.proposal,
          expected_volume: data.expectedVolume,
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, partnership: result }
    } catch (error) {
      console.error('Partnership submission error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Payment methods
  async setupPayment(paymentData: {
    stripeCustomerId: string
    stripePaymentMethodId: string
    cardLast4: string
    cardBrand: string
    selectedTier: 'free' | 'pro' | 'ai' | 'family'
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('payment_methods')
        .upsert({
          user_id: user.id,
          stripe_customer_id: paymentData.stripeCustomerId,
          stripe_payment_method_id: paymentData.stripePaymentMethodId,
          card_last4: paymentData.cardLast4,
          card_brand: paymentData.cardBrand,
          selected_tier: paymentData.selectedTier,
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, paymentMethod: data }
    } catch (error) {
      console.error('Setup payment error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async getPaymentMethod() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return { success: true, paymentMethod: data }
    } catch (error) {
      console.error('Get payment method error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async updatePaymentMethod(updates: Partial<PaymentMethod>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      return { success: true, paymentMethod: data }
    } catch (error) {
      console.error('Update payment method error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async removePaymentMethod() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Remove payment method error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Referral methods
  async getReferralStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('users')
        .select('referral_code, referral_count, position')
        .eq('id', user.id)
        .single()

      if (error) throw error

      return { success: true, stats: data }
    } catch (error) {
      console.error('Get referral stats error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Updates/Announcements
  async getUpdates() {
    try {
      const { data, error } = await supabase
        .from('updates')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })

      if (error) throw error

      return { success: true, updates: data }
    } catch (error) {
      console.error('Get updates error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Audit logging
  async logAction(action: string, details?: Record<string, unknown>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id,
          action,
          details,
        })

      // Don't throw on audit log errors
    } catch (error) {
      console.error('Audit log error:', error)
    }
  }
}

export const apiService = new ApiService()