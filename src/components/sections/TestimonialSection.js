"use client";
import { TestimonialCard } from '../ui/TestimonialCard';
import SectionHeading from './SectionHeading';

export function TestimonialSection({
  title,
  subtitle,
  testimonials,
  background = "gray" // "gray" or "white"
}) {
  return (
    <section className={`py-20 px-6 ${background === "gray" ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeading title={title} subtitle={subtitle} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <TestimonialCard 
              key={i}
              text={testimonial.text}
              name={testimonial.name}
              role={testimonial.role}
              company={testimonial.company}
              rating={testimonial.rating}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialSection;