import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export const DemoPreview = () => {
  const demoUrl = "https://lifenavigator-p4l7rhvtw-riffe007s-projects.vercel.app/dashboard";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.4 }} 
      className="mb-6 sm:mb-8"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">🚀 Try Our Live Demo</h3>
        
        {/* Clickable Thumbnail with iframe */}
        <a 
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block relative group"
        >
          <div className="relative overflow-hidden rounded-lg shadow-2xl border-2 border-gray-700 group-hover:border-primary transition-all duration-300">
            {/* Thumbnail Container */}
            <div 
              className="thumbnail-container" 
              style={{
                width: '341px',
                height: '192px',
                overflow: 'hidden',
                borderRadius: '4px',
                position: 'relative',
                background: '#0a0a0a'
              }}
            >
              <iframe 
                src={demoUrl}
                style={{
                  width: '1366px',
                  height: '768px',
                  transform: 'scale(0.25)',
                  transformOrigin: 'top left',
                  border: 'none',
                  pointerEvents: 'none'
                }}
                title="LifeNavigator Demo Preview"
                loading="lazy"
              />
            </div>
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                <span>Open Full Demo</span>
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
          </div>
          
          {/* Live Badge */}
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            LIVE
          </div>
        </a>
        
        <p className="text-sm text-muted-foreground mt-4">
          Click to explore the full dashboard
        </p>
      </div>
    </motion.div>
  );
};