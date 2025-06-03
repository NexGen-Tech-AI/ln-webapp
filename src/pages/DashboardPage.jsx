'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
    import { motion } from 'framer-motion';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Progress } from '@/components/ui/progress';
    import { useLocalStorage } from '@/hooks/useLocalStorage';
    import { useToast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/AuthContext';
    import { supabase } from '@/lib/supabase';
    import { Users, Gift, Link as LinkIcon, Share2, Clock, Info, Newspaper, Sparkles, DollarSign, TrendingUp, Briefcase, Target, Heart, BookOpen, ShieldCheck, Calculator, Building, Brain } from 'lucide-react';
import { ReferralTracker } from '@/components/dashboard/ReferralTracker';

    const domainIcons = {
      '💰 financial planning & wealth building': <DollarSign className="w-5 h-5 mr-2 text-primary" />,
      '📈 investment & portfolio management': <TrendingUp className="w-5 h-5 mr-2 text-primary" />,
      '💼 career development & networking': <Briefcase className="w-5 h-5 mr-2 text-primary" />,
      '🎯 goal setting & achievement tracking': <Target className="w-5 h-5 mr-2 text-primary" />,
      '🏥 health & wellness management': <Heart className="w-5 h-5 mr-2 text-primary" />,
      '📚 education & skill development': <BookOpen className="w-5 h-5 mr-2 text-primary" />,
      '📄 document vault & security': <ShieldCheck className="w-5 h-5 mr-2 text-primary" />,
      '🧮 tax strategy & optimization': <Calculator className="w-5 h-5 mr-2 text-primary" />,
      '🏢 business expense tracking': <Building className="w-5 h-5 mr-2 text-primary" />,
      '🧘 life balance & mental health': <Brain className="w-5 h-5 mr-2 text-primary" />,
    };
    
    const productUpdates = [
      { id: 1, title: "LifeNavigator Pilot Access Coming Soon!", content: "Get ready! Selected waitlist members will soon receive exclusive invites to the LifeNavigator Pilot program. Your journey to holistic life management is about to begin.", date: "2025-07-15", type: "Major Announcement", domain: "general" },
      { id: 2, title: "Preview: AI-Powered Goal Achievement System", content: "Our AI is learning to help you break down big goals into actionable steps. Expect smart suggestions and progress tracking like never before.", date: "2025-07-10", type: "Feature Sneak Peek", domain: "goal setting & achievement tracking" },
      { id: 3, title: "New: Integrated Wellness Module", content: "We've started building out the Health & Wellness module. Track your habits, set fitness goals, and monitor your well-being directly within LifeNavigator.", date: "2025-07-05", type: "Module Update", domain: "health & wellness management" },
      { id: 4, title: "Enhanced Financial Planning Tools", content: "We're refining our financial planning tools to offer more robust budgeting, investment tracking, and wealth projection capabilities.", date: "2025-06-28", type: "Feature Enhancement", domain: "financial planning & wealth building"},
      { id: 5, title: "Secure Document Vault: Phase 1 Complete", content: "The foundational infrastructure for our ultra-secure document vault is now in place. Next up: user interface and sharing options.", date: "2025-06-20", type: "Development Update", domain: "document vault & security"},
    ];

    const CountdownTimer = ({ launchDate }) => {
      const calculateTimeLeft = () => {
        const difference = +new Date(launchDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
          timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          };
        }
        return timeLeft;
      };

      const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

      useEffect(() => {
        const timer = setTimeout(() => {
          setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
      });

      const timerComponents = [];
      Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval] && timeLeft[interval] !==0) {
          return;
        }
        timerComponents.push(
          <div key={interval} className="text-center glassmorphic-card p-2 sm:p-3 rounded-lg">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">{timeLeft[interval]}</span>
            <span className="block text-xs uppercase text-muted-foreground">{interval}</span>
          </div>
        );
      });

      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {timerComponents.length ? timerComponents : <span className="col-span-full text-center text-lg sm:text-xl md:text-2xl font-semibold text-primary">LifeNavigator is Launching!</span>}
        </div>
      );
    };


    const DashboardPage = () => {
      const [user, setUser] = useState(null);
      const [loading, setLoading] = useState(true);
      const { user: authUser, isLoading: authLoading } = useAuth();
      const { toast } = useToast();
      const router = useRouter();
      const [showReferralBoost, setShowReferralBoost] = useState(false);
      const [filteredUpdates, setFilteredUpdates] = useState([]);
      const [totalWaitlisted, setTotalWaitlisted] = useState(0);

      useEffect(() => {
        // Don't redirect while auth is still loading
        if (authLoading) return;
        
        if (!authUser) {
          router.push('/login');
          return;
        }

        const fetchUserData = async () => {
          try {
            // Fetch user data from Supabase
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();

            if (userError) throw userError;

            // Get total waitlist count
            const { count, error: countError } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true });

            if (!countError && count) {
              setTotalWaitlisted(count);
            }

            // Transform data to match expected format
            const transformedUser = {
              ...userData,
              waitlistPosition: userData.position || 1,
              totalWaitlisted: count || 1,
              referralCode: userData.referral_code,
              referralCount: userData.referral_count || 0,
              interests: userData.interests || [],
              tierPreference: userData.tier_preference || 'free',
              joinedAt: userData.joined_at || userData.created_at
            };

            setUser(transformedUser);
          } catch (error) {
            console.error('Error fetching user data:', error);
            toast({
              title: 'Error loading dashboard',
              description: 'Please try refreshing the page.',
              variant: 'destructive'
            });
          } finally {
            setLoading(false);
          }
        };

        fetchUserData();
      }, [authUser, router, toast]);

      useEffect(() => {
        if (user && user.interests) {
          const userInterestKeys = user.interests.map(interest => interest.toLowerCase());
          const relevantUpdates = productUpdates.filter(update => 
            update.domain.toLowerCase() === "general" || userInterestKeys.includes(update.domain.toLowerCase())
          );
          setFilteredUpdates(relevantUpdates.sort((a,b) => new Date(b.date) - new Date(a.date)));
        } else if (user) {
           setFilteredUpdates(productUpdates.filter(update => update.domain.toLowerCase() === "general").sort((a,b) => new Date(b.date) - new Date(a.date)));
        }
      }, [user]);


      if (authLoading || loading) {
        return (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 text-center">
            <h1 className="text-3xl font-bold">Loading Your Navigator Dashboard...</h1>
            <p className="text-muted-foreground mt-2">Please wait...</p>
          </div>
        );
      }

      if (!user) {
        return (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 text-center">
            <h1 className="text-3xl font-bold">No user data found</h1>
            <p>Please <Link href="/signup" className="text-primary underline">join the waitlist</Link>.</p>
          </div>
        );
      }
      
      const { name, waitlistPosition, referralCode, referralCount, interests, tierPreference, joinedAt } = user;
      const launchDate = "2025-08-01T00:00:00Z"; // August 1, 2025 

      const handleShare = async (platform) => {
        const baseUrl = window.location.origin;
        const referralLink = `${baseUrl}/referral/${referralCode}`;
        const shareText = `I'm on the waitlist for LifeNavigator! Join with my referral link to jump 100 spots in line:`;
        let url = '';

        if (platform === 'twitter') {
          url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`;
        } else if (platform === 'linkedin') {
          url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent("Join the LifeNavigator Waitlist!")}&summary=${encodeURIComponent(shareText)}`;
        } else if (platform === 'copy') {
            try {
                await navigator.clipboard.writeText(referralLink);
                toast({ title: "Referral Link Copied!", description: "Share it with your network to climb the ranks!", variant: 'default' });
            } catch (err) {
                toast({ title: "Copy Failed", description: "Could not copy to clipboard. Please try again.", variant: "destructive" });
            }
            return;
        }
        
        if (url) window.open(url, '_blank');
      };
      

      const pageVariants = {
        initial: { opacity: 0, scale: 0.95 },
        in: { opacity: 1, scale: 1 },
        out: { opacity: 0, scale: 0.95 }
      };
    
      const pageTransition = {
        type: "spring",
        stiffness: 260,
        damping: 20
      };
      
      const getPersonalizedMessage = () => {
        if (!interests || interests.length === 0) {
          return "Let's start navigating your path to success!";
        }
        const firstInterestKey = interests[0].toLowerCase();
        let primaryFocus = "your goals";
        if (firstInterestKey.includes("financial") || firstInterestKey.includes("wealth") || firstInterestKey.includes("investment")) primaryFocus = "your financial empire";
        else if (firstInterestKey.includes("career") || firstInterestKey.includes("business")) primaryFocus = "your professional ascent";
        else if (firstInterestKey.includes("health") || firstInterestKey.includes("wellness") || firstInterestKey.includes("mental health")) primaryFocus = "your peak well-being";
        else if (firstInterestKey.includes("education") || firstInterestKey.includes("skill")) primaryFocus = "your continuous growth";
        
        return `Ready to conquer ${primaryFocus}? LifeNavigator is your copilot.`;
      };

      return (
        <motion.div 
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12"
        >
          <div className="mb-6 sm:mb-8 md:mb-12">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2">Welcome, Navigator <span className="gradient-text">{name}!</span></h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">{getPersonalizedMessage()}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.1}}>
              <Card className="glassmorphic-card h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-primary">Your Waitlist Position</CardTitle>
                  <Users className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold relative">
                    #{waitlistPosition.toLocaleString()}
                    {showReferralBoost && (
                      <motion.span 
                        initial={{ opacity: 0, y: 0, scale:0.5 }}
                        animate={{ opacity: [0,1,0], y: -40, scale: [0.5,1.5,0.5] }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="absolute -top-2 right-0 sm:-right-12 text-lg sm:text-xl md:text-2xl font-bold text-green-400"
                      >
                        -100!
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {totalWaitlisted.toLocaleString()} fellow Navigators
                  </p>
                  <Progress value={( (totalWaitlisted - waitlistPosition) / totalWaitlisted) * 100} className="w-full mt-4 h-2" />
                  <p className="text-sm text-muted-foreground mt-2">Joined: {new Date(joinedAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.2}}>
            <Card className="glassmorphic-card h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-primary">Quick Referral</CardTitle>
                <Gift className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Invite others & earn rewards when they become paying customers!
                </p>
                <div className="flex items-center space-x-2 mb-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input type="text" readOnly value={`${window.location.origin}/referral/${referralCode}`} className="bg-background/50 text-xs sm:text-sm p-2 truncate"/>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleShare('copy')} className="flex-1 min-h-[44px]">Copy</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleShare('twitter')} className="flex-1 min-h-[44px]">
                      <Share2 className="h-4 w-4 sm:mr-1"/>
                      <span className="hidden sm:inline">Tweet</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')} className="flex-1 min-h-[44px]">
                      <Share2 className="h-4 w-4 sm:mr-1"/>
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">Total Referrals: <strong className="text-foreground">{referralCount}</strong></p>
                <Link href="#referrals">
                  <Button size="sm" variant="secondary" className="mt-2 w-full">View Full Details</Button>
                </Link>
              </CardContent>
            </Card>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.3}}>
            <Card className="glassmorphic-card h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-primary">Countdown to Initial Launch</CardTitle>
                <Clock className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent>
                <CountdownTimer launchDate={launchDate} />
                <p className="text-xs text-muted-foreground mt-3 text-center">Est. Launch: {new Date(launchDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </CardContent>
            </Card>
            </motion.div>
          </div>

          <Tabs defaultValue="updates" className="w-full">
             <div className="overflow-x-auto mb-6">
               <TabsList className="grid w-full min-w-[300px] grid-cols-3 md:w-3/4 lg:w-1/2 bg-slate-800/50">
                  <TabsTrigger value="updates" className="flex items-center justify-center space-x-1 sm:space-x-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs sm:text-sm">
                    <Newspaper className="w-3 h-3 sm:w-4 sm:h-4"/>
                    <span>Updates</span>
                  </TabsTrigger>
                  <TabsTrigger value="domains" className="flex items-center justify-center space-x-1 sm:space-x-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs sm:text-sm">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4"/>
                    <span>Domains</span>
                  </TabsTrigger>
                  <TabsTrigger value="referrals" className="flex items-center justify-center space-x-1 sm:space-x-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs sm:text-sm">
                    <Gift className="w-3 h-3 sm:w-4 sm:h-4"/>
                    <span>Referrals</span>
                  </TabsTrigger>
               </TabsList>
             </div>
            
            <TabsContent value="updates">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.4}}>
              <Card className="glassmorphic-card">
                <CardHeader>
                  <CardTitle className="text-2xl">LifeNavigator News & Previews</CardTitle>
                  <CardDescription>The latest updates, filtered by your selected life domains.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 max-h-[300px] sm:max-h-[400px] md:max-h-[500px] overflow-y-auto pr-2">
                  {filteredUpdates.length > 0 ? filteredUpdates.map(update => (
                    <div key={update.id} className="pb-4 border-b border-border last:border-b-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 gap-1 sm:gap-2">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-primary">{update.title}</h3>
                        <span className="text-xs capitalize px-2 py-1 rounded-full bg-primary/10 text-primary-foreground border border-primary/30 whitespace-nowrap self-start flex-shrink-0">
                          {update.domain.split(" ")[0]}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">{new Date(update.date).toLocaleDateString()} - <span className="font-medium text-foreground">{update.type}</span></p>
                      <p className="text-foreground text-xs sm:text-sm">{update.content}</p>
                    </div>
                  )) : (
                    <p className="text-muted-foreground">No specific updates for your selected domains right now, but general platform news will appear here!</p>
                  )}
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="domains">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.4}}>
              <Card className="glassmorphic-card">
                <CardHeader>
                  <CardTitle className="text-2xl">Your Focused Life Domains</CardTitle>
                  <CardDescription>Track development progress and see "Coming Soon" previews for your key areas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {interests && interests.length > 0 ? interests.map(interestLabel => {
                    const progressValue = Math.floor(Math.random() * 50) + 15; // Mock progress
                    const iconKey = interestLabel.toLowerCase();
                    return (
                        <div key={interestLabel} className="p-4 rounded-md border border-input bg-background/30">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                    {domainIcons[iconKey] || <Sparkles className="w-5 h-5 mr-2 text-primary"/>}
                                    <span className="text-foreground font-medium">{interestLabel.substring(2)}</span>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">Module In Development</span>
                            </div>
                            <Progress value={progressValue} className="h-2"/>
                            <p className="text-xs text-muted-foreground mt-1">{progressValue}% of core features for this domain are in active development.</p>
                            <p className="text-xs text-primary mt-1">Preview: Expect initial tools for '{interestLabel.substring(2)}' in early access builds.</p>
                        </div>
                    );
                  }) : (
                    <p className="text-muted-foreground">You haven't selected any specific life domains yet. Update these in settings (once available) to personalize your dashboard!</p>
                  )}
                  <div className="mt-4 p-3 rounded-md border border-dashed border-primary/50 bg-primary/10">
                    <p className="text-xs sm:text-sm text-primary flex items-start sm:items-center">
                      <Info className="w-4 h-4 mr-2 shrink-0 mt-0.5 sm:mt-0" />
                      <span>Your chosen tier: <strong className="capitalize">{tierPreference.replace(" Navigator", "")} Navigator</strong>. You'll unlock features based on this tier at launch.</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>
            
            <TabsContent value="referrals">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay: 0.4}}>
                <ReferralTracker user={user} />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      );
    };

    export default DashboardPage;