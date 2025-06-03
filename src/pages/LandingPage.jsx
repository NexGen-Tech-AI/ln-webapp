'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { CheckCircle, Users, Gift, TrendingUp, Zap, MessageSquare, DollarSign, Briefcase, Heart, BookOpen, ShieldCheck, Calculator, Building, Brain } from 'lucide-react';
    import ParticleButton from '@/components/shared/ParticleButton';
    import { supabase } from '@/lib/supabase';

    const AnimatedCounter = ({ targetValue, duration = 2000 }) => {
      const [count, setCount] = useState(0);

      useEffect(() => {
        let start = 0;
        const end = targetValue;
        if (start === end) return;

        let startTime = null;
        const step = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          setCount(Math.floor(progress * (end - start) + start));
          if (progress < 1) {
            window.requestAnimationFrame(step);
          }
        };
        window.requestAnimationFrame(step);
      }, [targetValue, duration]);

      return <span className="text-5xl md:text-6xl font-bold gradient-text">{count.toLocaleString()}</span>;
    };
    

    const featureDomains = [
      { title: "Wealth & Finance", description: "Master your money, from planning to portfolio growth.", icon: <DollarSign className="w-10 h-10 text-primary mb-4" />, color: "from-green-500/20 to-green-700/20" },
      { title: "Career & Business", description: "Elevate your professional life, track goals, and expand your network.", icon: <Briefcase className="w-10 h-10 text-primary mb-4" />, color: "from-blue-500/20 to-blue-700/20" },
      { title: "Health & Wellness", description: "Prioritize your well-being for peak performance and life balance.", icon: <Heart className="w-10 h-10 text-primary mb-4" />, color: "from-red-500/20 to-red-700/20" },
      { title: "Knowledge & Skills", description: "Continuously learn and develop new skills for personal and professional evolution.", icon: <BookOpen className="w-10 h-10 text-primary mb-4" />, color: "from-yellow-500/20 to-yellow-700/20" },
      { title: "Productivity & Security", description: "Organize documents, track goals, and ensure your data is secure.", icon: <ShieldCheck className="w-10 h-10 text-primary mb-4" />, color: "from-purple-500/20 to-purple-700/20" },
      { title: "Life Balance", description: "Cultivate mental well-being and harmony across all life domains.", icon: <Brain className="w-10 h-10 text-primary mb-4" />, color: "from-teal-500/20 to-teal-700/20" },
    ];


    const LandingPage = () => {
      const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/8d2e5595-333d-4b29-aceb-3caf9db7419a/0bac9eba2ebb123bd12dc9c18a1b9973.png";
      const router = useRouter();
      const [userCount, setUserCount] = useState(100);

      useEffect(() => {
        const fetchUserCount = async () => {
          const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
          
          if (!error && count) {
            setUserCount(100 + count);
          }
        };

        fetchUserCount();
      }, []);



      const pageVariants = {
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -20 }
      };
    
      const pageTransition = {
        type: "tween",
        ease: "anticipate",
        duration: 0.5
      };

      return (
        <motion.div 
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="container mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          {/* Hero Section */}
          <section className="text-center py-16 md:py-24 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
              {[...Array(5)].map((_, i) => (
                 <motion.div
                    key={i}
                    className="absolute w-1 h-40 bg-primary/50 rounded-full animate-meteor"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                    }}
                  />
              ))}
            </div>
            <motion.div 
              initial={{ opacity:0, y: -20 }}
              animate={{ opacity:1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8 flex justify-center"
            >
              <img src={logoUrl} alt="LifeNavigator Logo" className="h-20 md:h-24 w-auto" />
            </motion.div>
            <motion.h1 
              initial={{ opacity:0, y: 20 }}
              animate={{ opacity:1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4"
            >
              Build the <span className="gradient-text">Life You Want</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity:0, y: 20 }}
              animate={{ opacity:1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 px-4"
            >
              Manage wealth, health, career, and growth in one intelligent platform.
            </motion.p>
            <motion.div 
              initial={{ opacity:0, scale: 0.8 }}
              animate={{ opacity:1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 100 }}
              className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <ParticleButton onClick={() => router.push('/signup')}>
                Join the Waitlist Now
              </ParticleButton>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('domains-section')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Domains
              </Button>
            </motion.div>
            <motion.div 
              initial={{ opacity:0, y: 20 }}
              animate={{ opacity:1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-16"
            >
              <p className="text-lg text-muted-foreground mb-2">Join <AnimatedCounter targetValue={userCount} /> visionary builders already on the list!</p>
            </motion.div>
          </section>

          {/* Feature Domains Section */}
          <section id="domains-section" className="py-16 md:py-24">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 px-4">Navigate Every Aspect of Your Life</h2>
            <p className="text-lg sm:text-xl text-muted-foreground text-center mb-16 max-w-2xl mx-auto px-4">LifeNavigator integrates all critical domains for holistic success and empire building.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featureDomains.map((domain, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className={`glassmorphic-card h-full p-6 text-center hover:border-primary transition-all duration-300 transform hover:scale-105 bg-gradient-to-br ${domain.color}`}>
                    <div className="flex justify-center">{domain.icon}</div>
                    <CardTitle className="text-2xl mt-2 mb-3">{domain.title}</CardTitle>
                    <CardDescription className="text-muted-foreground p-0">{domain.description}</CardDescription>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>


          {/* Benefits Section */}
          <section id="benefits-section" className="py-16 md:py-24">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 px-4">
              Why Join the <span className="gradient-text">Waitlist?</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: <Gift className="w-12 h-12 text-primary mb-4" />, title: "10% Lifetime Discount", description: "Secure an exclusive 10% discount on any paid plan, forever." },
                { icon: <Users className="w-12 h-12 text-primary mb-4" />, title: "Early Access", description: "Be among the first to experience LifeNavigator and shape its future." },
                { icon: <TrendingUp className="w-12 h-12 text-primary mb-4" />, title: "Priority Support", description: "Get bumped to the front of the queue for any assistance you need." },
                { icon: <Zap className="w-12 h-12 text-primary mb-4" />, title: "Exclusive Content", description: "Receive insider updates, previews, and life strategy guides." },
                { icon: <CheckCircle className="w-12 h-12 text-primary mb-4" />, title: "Shape the Product", description: "Your feedback will directly influence new features and improvements." },
                { icon: <MessageSquare className="w-12 h-12 text-primary mb-4" />, title: "Elite Community", description: "Join a private community of fellow empire builders for networking and insights." }
              ].map((benefit, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity:0, y: 20 }}
                  whileInView={{ opacity:1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="glassmorphic-card h-full p-6 text-center hover:border-primary transition-all duration-300 transform hover:scale-105">
                    <div className="flex justify-center">{benefit.icon}</div>
                    <CardTitle className="text-2xl mt-2 mb-3">{benefit.title}</CardTitle>
                    <CardContent className="text-muted-foreground p-0">{benefit.description}</CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>


          {/* Signup CTA Section */}
          <section id="signup-section" className="py-16 md:py-24 text-center">
            <motion.div
              initial={{ opacity:0, y: 20 }}
              whileInView={{ opacity:1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="glassmorphic-card max-w-3xl mx-auto p-8 md:p-12 rounded-xl"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Ready to Navigate Your <span className="gradient-text">Empire?</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-10">
                Don't miss out on exclusive benefits. Join the LifeNavigator waitlist today and be the first to revolutionize how you manage your entire life.
              </p>
              <ParticleButton onClick={() => router.push('/signup')}>
                Secure Your Spot
              </ParticleButton>
            </motion.div>
          </section>
        </motion.div>
      );
    };

    export default LandingPage;