"use client";
import { FAQItem } from '../ui/FAQItem';
import { Button } from '../ui/Button';
import SectionHeading from './SectionHeading';

export function FAQSection({ 
  title = "Frequently Asked Questions",
  subtitle,
  faqs,
  contactCTA = true,
  background = "white" // "white" or "gray"
}) {
  return (
    <section className={`py-20 px-6 ${background === "gray" ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-4xl mx-auto">
        <SectionHeading title={title} subtitle={subtitle} />
        
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <FAQItem 
              key={i}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
        
        {contactCTA && (
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-600 mb-6">Still have questions?</p>
            <Button 
              href="/contact" 
              variant="secondary" 
              size="md"
            >
              Contact Our Support Team
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export default FAQSection;