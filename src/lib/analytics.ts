// Analytics tracking library
import { v4 as uuidv4 } from 'uuid'

interface PageViewData {
  page_path: string
  page_title?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

interface FormInteraction {
  form_name: string
  step?: number
  field_name?: string
  interaction_type?: 'focus' | 'blur' | 'change' | 'error'
}

interface ClickEvent {
  element_id?: string
  element_text?: string
  element_type?: string
  target_url?: string
}

class AnalyticsTracker {
  private sessionId: string
  private visitorId: string
  private pageViewId: string | null = null
  private pageStartTime: number = 0
  private formStartTime: number = 0
  private currentFormId: string | null = null
  private isReturningVisitor: boolean = false

  constructor() {
    this.sessionId = this.getOrCreateSessionId()
    this.visitorId = this.getOrCreateVisitorId()
    this.checkReturningVisitor()
    this.initializeSession()
    this.setupEventListeners()
  }

  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('analytics_session_id')
    if (stored) return stored

    const newId = uuidv4()
    sessionStorage.setItem('analytics_session_id', newId)
    return newId
  }

  private getOrCreateVisitorId(): string {
    const stored = localStorage.getItem('analytics_visitor_id')
    if (stored) return stored

    const newId = uuidv4()
    localStorage.setItem('analytics_visitor_id', newId)
    return newId
  }

  private checkReturningVisitor(): void {
    const visitCount = parseInt(localStorage.getItem('visit_count') || '0')
    if (visitCount > 0) {
      this.isReturningVisitor = true
    }
    localStorage.setItem('visit_count', (visitCount + 1).toString())
  }

  private async initializeSession(): Promise<void> {
    const sessionData = {
      visitor_id: this.visitorId,
      user_agent: navigator.userAgent,
      language: navigator.language,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      entry_page: window.location.pathname,
      is_returning_visitor: this.isReturningVisitor,
      referrer: document.referrer,
      ...this.getDeviceInfo(),
      ...this.getUTMParams()
    }

    try {
      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: this.sessionId, ...sessionData })
      })
    } catch (error) {
      console.error('Failed to initialize analytics session:', error)
    }
  }

  private getDeviceInfo() {
    const ua = navigator.userAgent
    const mobile = /Mobile|Android|iPhone|iPad/i.test(ua)
    const tablet = /iPad|Android(?!.*Mobile)/i.test(ua)
    
    return {
      device_type: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop',
      browser: this.getBrowser(),
      os: this.getOS()
    }
  }

  private getBrowser(): string {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Edge')) return 'Edge'
    return 'Other'
  }

  private getOS(): string {
    const ua = navigator.userAgent
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS')) return 'iOS'
    return 'Other'
  }

  private getUTMParams() {
    const params = new URLSearchParams(window.location.search)
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content')
    }
  }

  private getReferrerSource(referrer: string): string {
    if (!referrer) return 'direct'
    
    const domain = new URL(referrer).hostname
    if (domain.includes('google')) return 'google'
    if (domain.includes('facebook')) return 'facebook'
    if (domain.includes('twitter') || domain.includes('t.co')) return 'twitter'
    if (domain.includes('linkedin')) return 'linkedin'
    if (domain.includes('reddit')) return 'reddit'
    if (domain.includes('youtube')) return 'youtube'
    
    return 'other'
  }

  private setupEventListeners(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.endPageView()
      } else {
        this.pageStartTime = Date.now()
      }
    })

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.endPageView()
      this.endSession()
    })

    // Track clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        this.trackClick({
          element_id: target.id,
          element_text: target.innerText?.substring(0, 50),
          element_type: target.tagName.toLowerCase(),
          target_url: (target as HTMLAnchorElement).href
        })
      }
    })
  }

  async trackPageView(data: PageViewData): Promise<void> {
    // End previous page view
    if (this.pageViewId) {
      await this.endPageView()
    }

    this.pageStartTime = Date.now()
    
    const pageViewData = {
      session_id: this.sessionId,
      page_path: data.page_path,
      page_title: data.page_title || document.title,
      referrer: data.referrer || document.referrer,
      referrer_source: this.getReferrerSource(data.referrer || document.referrer),
      ...this.getUTMParams()
    }

    try {
      const response = await fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageViewData)
      })
      
      const result = await response.json()
      this.pageViewId = result.id
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }

  private async endPageView(): Promise<void> {
    if (!this.pageViewId || !this.pageStartTime) return

    const duration = Math.floor((Date.now() - this.pageStartTime) / 1000)
    
    try {
      await fetch('/api/analytics/pageview/duration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_view_id: this.pageViewId,
          duration_seconds: duration
        })
      })
    } catch (error) {
      console.error('Failed to update page view duration:', error)
    }
  }

  async trackFormStart(form_name: string, total_steps: number = 1): Promise<void> {
    this.formStartTime = Date.now()
    
    const formData = {
      session_id: this.sessionId,
      form_name,
      total_steps,
      step_reached: 1
    }

    try {
      const response = await fetch('/api/analytics/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      this.currentFormId = result.id
    } catch (error) {
      console.error('Failed to track form start:', error)
    }
  }

  async trackFormStep(step: number, time_spent?: number): Promise<void> {
    if (!this.currentFormId) return

    try {
      await fetch(`/api/analytics/form/${this.currentFormId}/step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, time_spent })
      })
    } catch (error) {
      console.error('Failed to track form step:', error)
    }
  }

  async trackFormAbandon(step: number, reason?: string): Promise<void> {
    if (!this.currentFormId) return

    const totalTime = Math.floor((Date.now() - this.formStartTime) / 1000)

    try {
      await fetch(`/api/analytics/form/${this.currentFormId}/abandon`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abandoned_at_step: step,
          abandoned_reason: reason,
          total_time_seconds: totalTime
        })
      })
    } catch (error) {
      console.error('Failed to track form abandonment:', error)
    }

    this.currentFormId = null
  }

  async trackFormComplete(): Promise<void> {
    if (!this.currentFormId) return

    const totalTime = Math.floor((Date.now() - this.formStartTime) / 1000)

    try {
      await fetch(`/api/analytics/form/${this.currentFormId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_time_seconds: totalTime
        })
      })
    } catch (error) {
      console.error('Failed to track form completion:', error)
    }

    this.currentFormId = null
  }

  async trackClick(data: ClickEvent): Promise<void> {
    try {
      await fetch('/api/analytics/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          page_path: window.location.pathname,
          ...data
        })
      })
    } catch (error) {
      console.error('Failed to track click:', error)
    }
  }

  async trackConversion(type: string, value?: number): Promise<void> {
    const visitCount = parseInt(localStorage.getItem('visit_count') || '1')
    const firstVisit = parseInt(localStorage.getItem('first_visit') || Date.now().toString())
    const timeToConvert = Math.floor((Date.now() - firstVisit) / 1000)

    try {
      await fetch('/api/analytics/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          conversion_type: type,
          conversion_value: value,
          time_to_convert_seconds: timeToConvert,
          visit_count_before_conversion: visitCount,
          attribution_source: this.getReferrerSource(document.referrer)
        })
      })
    } catch (error) {
      console.error('Failed to track conversion:', error)
    }
  }

  private async endSession(): Promise<void> {
    try {
      await fetch(`/api/analytics/session/${this.sessionId}/end`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exit_page: window.location.pathname
        })
      })
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }
}

// Export singleton instance
// Lazy initialization to prevent blocking
let analyticsInstance: AnalyticsTracker | null = null

export const analytics = {
  get instance() {
    if (typeof window === 'undefined') return null
    if (!analyticsInstance) {
      analyticsInstance = new AnalyticsTracker()
    }
    return analyticsInstance
  },
  // Proxy methods to the instance
  trackPageView: (page: string, referrer?: string) => analytics.instance?.trackPageView(page, referrer),
  trackEvent: (event: AnalyticsEvent) => analytics.instance?.trackEvent(event),
  trackFormStart: (formId: string, formName?: string) => analytics.instance?.trackFormStart(formId, formName),
  trackFormStep: (formId: string, step: number, stepName?: string) => analytics.instance?.trackFormStep(formId, step, stepName),
  trackFormComplete: (formId: string) => analytics.instance?.trackFormComplete(formId),
  trackFormAbandon: (formId: string) => analytics.instance?.trackFormAbandon(formId),
  trackClick: (element: string, properties?: Record<string, any>) => analytics.instance?.trackClick(element, properties),
  updatePageDuration: () => analytics.instance?.updatePageDuration(),
}

// Make analytics available globally
if (typeof window !== 'undefined') {
  (window as any).analytics = analytics
}