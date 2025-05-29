
    import React from 'react';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';

    const ParticleButton = ({ children, onClick, className }) => {
      return (
        <Button 
          onClick={onClick} 
          className={`relative overflow-hidden bg-primary-gradient hover:opacity-90 transition-opacity duration-300 text-primary-foreground font-semibold ${className}`}
          size="lg"
        >
          {[...Array(15)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-white/30"
              style={{
                width: Math.random() * 5 + 2,
                height: Math.random() * 5 + 2,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1.2, 0],
                x: (Math.random() - 0.5) * 60,
                y: (Math.random() - 0.5) * 60,
              }}
              transition={{
                duration: Math.random() * 1 + 0.5,
                repeat: Infinity,
                repeatDelay: Math.random() * 3 + 1,
                delay: Math.random() * 1,
                ease: "easeInOut"
              }}
            />
          ))}
          <span className="relative z-10">{children}</span>
        </Button>
      );
    };

    export default ParticleButton;
  