"use client";
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function HeroSection({ 
  title, 
  highlight,
  description, 
  primaryButtonText = "Get Started",
  primaryButtonHref = "/signup",
  secondaryButtonText,
  secondaryButtonHref,
  secondaryButtonOnClick,
  backgroundStyle = "gradient" // "gradient" or "plain"
}) {
  return (
    <section className={`relative py-20 px-6 overflow-hidden ${
      backgroundStyle === "gradient" 
        ? "bg-gradient-to-br from-blue-600 to-blue-400 text-white" 
        : "bg-white text-[#222222]"
    }`}>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            {title} {highlight && <span className="text-yellow-300">{highlight}</span>}
          </h1>
          
          <p className="text-xl max-w-xl mb-8">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              href={primaryButtonHref} 
              variant={backgroundStyle === "gradient" ? "white" : "primary"}
              size="xl"
              className="transform hover:scale-105"
            >
              {primaryButtonText}
              <ArrowRight size={20} className="ml-2" />
            </Button>
            
            {secondaryButtonText && (
              <Button 
                href={secondaryButtonHref}
                onClick={secondaryButtonOnClick}
                variant="outline"
                size="xl"
              >
                {secondaryButtonText}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-30 transform -translate-x-1/2 translate-y-1/2"></div>
    </section>
  );
}