"use client";
import { Button } from '../ui/Button';

export function CTASection({
  title,
  description,
  primaryButtonText = "Start Free Trial",
  primaryButtonHref = "/signup",
  secondaryButtonText,
  secondaryButtonHref,
  footnote = "No credit card required • Cancel anytime"
}) {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
      
      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl font-bold mb-6">{title}</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Button 
            href={primaryButtonHref}
            variant="white"
            size="xl"
            className="shadow-xl hover:shadow-2xl hover:scale-105"
          >
            {primaryButtonText}
          </Button>
          
          {secondaryButtonText && (
            <Button 
              href={secondaryButtonHref}
              variant="outline"
              size="xl"
            >
              {secondaryButtonText}
            </Button>
          )}
        </div>
        
        {footnote && (
          <p className="mt-6 text-blue-200">{footnote}</p>
        )}
      </div>
    </section>
  );
}

export default CTASection;