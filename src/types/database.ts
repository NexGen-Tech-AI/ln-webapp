export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          profession: string | null
          company: string | null
          position: number
          referral_code: string
          referred_by: string | null
          referral_count: number
          interests: string[]
          tier_preference: string
          joined_at: string
          last_login: string | null
          email_verified: boolean
          verification_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          profession?: string | null
          company?: string | null
          position?: number
          referral_code?: string
          referred_by?: string | null
          referral_count?: number
          interests?: string[]
          tier_preference?: string
          joined_at?: string
          last_login?: string | null
          email_verified?: boolean
          verification_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          profession?: string | null
          company?: string | null
          position?: number
          referral_code?: string
          referred_by?: string | null
          referral_count?: number
          interests?: string[]
          tier_preference?: string
          joined_at?: string
          last_login?: string | null
          email_verified?: boolean
          verification_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pilot_applications: {
        Row: {
          id: string
          user_id: string
          why_pilot: string
          biggest_challenge: string
          hours_per_week: number
          commit_feedback: boolean
          feedback_explanation: string | null
          linkedin_url: string | null
          twitter_handle: string | null
          website_url: string | null
          status: 'pending' | 'approved' | 'declined'
          admin_notes: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          why_pilot: string
          biggest_challenge: string
          hours_per_week: number
          commit_feedback: boolean
          feedback_explanation?: string | null
          linkedin_url?: string | null
          twitter_handle?: string | null
          website_url?: string | null
          status?: 'pending' | 'approved' | 'declined'
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          why_pilot?: string
          biggest_challenge?: string
          hours_per_week?: number
          commit_feedback?: boolean
          feedback_explanation?: string | null
          linkedin_url?: string | null
          twitter_handle?: string | null
          website_url?: string | null
          status?: 'pending' | 'approved' | 'declined'
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
      }
      partnership_requests: {
        Row: {
          id: string
          company_name: string
          website: string
          industry: string
          contact_name: string
          contact_role: string
          contact_email: string
          contact_phone: string | null
          company_size: string | null
          revenue_range: string | null
          partnership_types: string[]
          proposal: string
          expected_volume: string | null
          status: 'new' | 'contacted' | 'in_progress' | 'closed'
          created_at: string
        }
        Insert: {
          id?: string
          company_name: string
          website: string
          industry: string
          contact_name: string
          contact_role: string
          contact_email: string
          contact_phone?: string | null
          company_size?: string | null
          revenue_range?: string | null
          partnership_types: string[]
          proposal: string
          expected_volume?: string | null
          status?: 'new' | 'contacted' | 'in_progress' | 'closed'
          created_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          website?: string
          industry?: string
          contact_name?: string
          contact_role?: string
          contact_email?: string
          contact_phone?: string | null
          company_size?: string | null
          revenue_range?: string | null
          partnership_types?: string[]
          proposal?: string
          expected_volume?: string | null
          status?: 'new' | 'contacted' | 'in_progress' | 'closed'
          created_at?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_payment_method_id: string
          card_last4: string | null
          card_brand: string | null
          selected_tier: 'free' | 'pro' | 'ai' | 'family'
          auto_enroll: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_payment_method_id: string
          card_last4?: string | null
          card_brand?: string | null
          selected_tier: 'free' | 'pro' | 'ai' | 'family'
          auto_enroll?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          card_last4?: string | null
          card_brand?: string | null
          selected_tier?: 'free' | 'pro' | 'ai' | 'family'
          auto_enroll?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      updates: {
        Row: {
          id: string
          title: string
          content: string
          domain: string | null
          type: 'feature' | 'announcement' | 'milestone'
          published: boolean
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          domain?: string | null
          type: 'feature' | 'announcement' | 'milestone'
          published?: boolean
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          domain?: string | null
          type?: 'feature' | 'announcement' | 'milestone'
          published?: boolean
          published_at?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
  }
}