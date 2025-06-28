import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, ArrowRight, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const result = await login(formData.email, formData.password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Welcome back! 🧭',
        description: 'Successfully logged in to your account.',
        variant: 'default',
        duration: 3000,
      });
      router.push('/dashboard');
    } else {
      toast({
        title: 'Login failed',
        description: result.error || 'Invalid credentials. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="container mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 flex justify-center items-center min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)]"
    >
      <Card className="w-full max-w-sm sm:max-w-md glassmorphic-card shadow-xl sm:shadow-2xl">
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold gradient-text text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Log in to your LifeNavigator account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@empire.com"
                className={`h-11 text-sm sm:text-base ${errors.email ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              {errors.email && <p className="text-xs sm:text-sm text-destructive mt-1">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className={`h-11 text-sm sm:text-base ${errors.password ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              {errors.password && <p className="text-xs sm:text-sm text-destructive mt-1">{errors.password}</p>}
            </div>
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-xs sm:text-sm text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 p-4 sm:p-6">
            <Button
              type="submit"
              className="w-full min-h-[44px] bg-primary-gradient hover:opacity-90 transition-opacity duration-300 text-primary-foreground font-medium sm:font-semibold flex items-center justify-center space-x-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </>
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-primary hover:underline font-semibold"
              >
                Join the waitlist
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Link
              href="/"
              className="text-center text-sm text-primary hover:underline flex items-center justify-center space-x-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Explore LifeNavigator</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default LoginPage;