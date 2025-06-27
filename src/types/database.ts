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
          avatar_url: string | null
          user_type: 'pilot' | 'waitlist' | 'regular'
          auth_provider: string
          email_verified_at: string | null
          paying_referral_count: number
          service_verified: boolean
          service_type: 'military' | 'veteran' | 'first_responder' | 'teacher' | null
          service_verification_date: string | null
          idme_verification_id: string | null
          is_paying: boolean
          subscription_tier: string | null
          subscription_amount: string | null
          verification_token_expires: string | null
          password_reset_token: string | null
          password_reset_expires: string | null
          email_encrypted: string | null
          profession_encrypted: string | null
          company_encrypted: string | null
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
          avatar_url?: string | null
          user_type?: 'pilot' | 'waitlist' | 'regular'
          auth_provider?: string
          email_verified_at?: string | null
          paying_referral_count?: number
          service_verified?: boolean
          service_type?: 'military' | 'veteran' | 'first_responder' | 'teacher' | null
          service_verification_date?: string | null
          idme_verification_id?: string | null
          is_paying?: boolean
          subscription_tier?: string | null
          subscription_amount?: string | null
          verification_token_expires?: string | null
          password_reset_token?: string | null
          password_reset_expires?: string | null
          email_encrypted?: string | null
          profession_encrypted?: string | null
          company_encrypted?: string | null
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
          avatar_url?: string | null
          user_type?: 'pilot' | 'waitlist' | 'regular'
          auth_provider?: string
          email_verified_at?: string | null
          paying_referral_count?: number
          service_verified?: boolean
          service_type?: 'military' | 'veteran' | 'first_responder' | 'teacher' | null
          service_verification_date?: string | null
          idme_verification_id?: string | null
          is_paying?: boolean
          subscription_tier?: string | null
          subscription_amount?: string | null
          verification_token_expires?: string | null
          password_reset_token?: string | null
          password_reset_expires?: string | null
          email_encrypted?: string | null
          profession_encrypted?: string | null
          company_encrypted?: string | null
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
          entity_type: string | null
          entity_id: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          entity_type?: string | null
          entity_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          entity_type?: string | null
          entity_id?: string | null
        }
      }
      security_config: {
        Row: {
          id: string
          key_name: string
          key_value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key_name: string
          key_value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key_name?: string
          key_value?: string
          created_at?: string
          updated_at?: string
        }
      }
      referral_tracking: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          created_at: string
          is_successful: boolean
          converted_at: string | null
          first_payment_at: string | null
          subscription_tier: string | null
          subscription_amount: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          created_at?: string
          is_successful?: boolean
          converted_at?: string | null
          first_payment_at?: string | null
          subscription_tier?: string | null
          subscription_amount?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          created_at?: string
          is_successful?: boolean
          converted_at?: string | null
          first_payment_at?: string | null
          subscription_tier?: string | null
          subscription_amount?: string | null
        }
      }
      referral_rewards: {
        Row: {
          id: string
          user_type: string
          required_referrals: number
          reward_type: string
          reward_value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_type: string
          required_referrals: number
          reward_type: string
          reward_value: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_type?: string
          required_referrals?: number
          reward_type?: string
          reward_value?: number
          created_at?: string
          updated_at?: string
        }
      }
      referral_credits: {
        Row: {
          id: string
          user_id: string
          credit_amount: string
          tier_value: string
          expires_at: string | null
          is_used: boolean
          used_at: string | null
          referral_batch_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credit_amount: string
          tier_value: string
          expires_at?: string | null
          is_used?: boolean
          used_at?: string | null
          referral_batch_count: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credit_amount?: string
          tier_value?: string
          expires_at?: string | null
          is_used?: boolean
          used_at?: string | null
          referral_batch_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      page_views: {
        Row: {
          id: string
          user_id: string
          session_id: string
          page_path: string
          referrer: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          page_path: string
          referrer?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          page_path?: string
          referrer?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          page_count: number
          browser: string | null
          os: string | null
          device_type: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          page_count?: number
          browser?: string | null
          os?: string | null
          device_type?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          page_count?: number
          browser?: string | null
          os?: string | null
          device_type?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
      form_analytics: {
        Row: {
          id: string
          user_id: string | null
          form_name: string
          field_name: string
          action: string
          value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          form_name: string
          field_name: string
          action: string
          value?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          form_name?: string
          field_name?: string
          action?: string
          value?: string | null
          created_at?: string
        }
      }
      click_events: {
        Row: {
          id: string
          user_id: string | null
          element_id: string | null
          element_text: string | null
          page_path: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          element_id?: string | null
          element_text?: string | null
          page_path: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          element_id?: string | null
          element_text?: string | null
          page_path?: string
          created_at?: string
        }
      }
      conversions: {
        Row: {
          id: string
          user_id: string
          conversion_type: string
          conversion_value: string | null
          source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversion_type: string
          conversion_value?: string | null
          source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversion_type?: string
          conversion_value?: string | null
          source?: string | null
          created_at?: string
        }
      }
      email_campaigns: {
        Row: {
          id: string
          name: string
          subject: string
          content: string
          segment_id: string | null
          status: string
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number
          open_count: number
          click_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subject: string
          content: string
          segment_id?: string | null
          status?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          open_count?: number
          click_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          content?: string
          segment_id?: string | null
          status?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number
          open_count?: number
          click_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      email_events: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          event_type: string
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          event_type: string
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          event_type?: string
          created_at?: string
        }
      }
      email_queue: {
        Row: {
          id: string
          to_email: string
          subject: string
          content: string
          status: string
          attempts: number
          last_attempt_at: string | null
          sent_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          to_email: string
          subject: string
          content: string
          status?: string
          attempts?: number
          last_attempt_at?: string | null
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          to_email?: string
          subject?: string
          content?: string
          status?: string
          attempts?: number
          last_attempt_at?: string | null
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      user_segments: {
        Row: {
          id: string
          name: string
          description: string | null
          criteria: Json
          member_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          criteria: Json
          member_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          criteria?: Json
          member_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_segment_members: {
        Row: {
          segment_id: string
          user_id: string
          added_at: string
        }
        Insert: {
          segment_id: string
          user_id: string
          added_at?: string
        }
        Update: {
          segment_id?: string
          user_id?: string
          added_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          role: string
          permissions: Json
          is_active: boolean
          last_login: string | null
          mfa_enabled: boolean
          mfa_secret: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          permissions?: Json
          is_active?: boolean
          last_login?: string | null
          mfa_enabled?: boolean
          mfa_secret?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          permissions?: Json
          is_active?: boolean
          last_login?: string | null
          mfa_enabled?: boolean
          mfa_secret?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      security_audit_log: {
        Row: {
          id: string
          table_name: string
          operation: string
          user_id: string | null
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          operation: string
          user_id?: string | null
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          operation?: string
          user_id?: string | null
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      oauth_connections: {
        Row: {
          id: string
          user_id: string
          provider: string
          provider_user_id: string
          email: string | null
          name: string | null
          avatar_url: string | null
          raw_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          provider_user_id: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          raw_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          provider_user_id?: string
          email?: string | null
          name?: string | null
          avatar_url?: string | null
          raw_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      rate_limits: {
        Row: {
          id: string
          identifier: string
          endpoint: string
          count: number
          window_start: string
          created_at: string
        }
        Insert: {
          id?: string
          identifier: string
          endpoint: string
          count?: number
          window_start: string
          created_at?: string
        }
        Update: {
          id?: string
          identifier?: string
          endpoint?: string
          count?: number
          window_start?: string
          created_at?: string
        }
      }
      performance_logs: {
        Row: {
          id: string
          query_name: string
          duration_ms: number
          row_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          query_name: string
          duration_ms: number
          row_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          query_name?: string
          duration_ms?: number
          row_count?: number | null
          created_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_referral_milestone: boolean
          email_referral_converted: boolean
          email_product_updates: boolean
          email_marketing: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_referral_milestone?: boolean
          email_referral_converted?: boolean
          email_product_updates?: boolean
          email_marketing?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_referral_milestone?: boolean
          email_referral_converted?: boolean
          email_product_updates?: boolean
          email_marketing?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}