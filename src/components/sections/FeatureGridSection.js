"use client";
import { FeatureCard } from '../ui/FeatureCard';
import SectionHeading from './SectionHeading';

export function FeatureGridSection({ 
  title, 
  subtitle, 
  features,
  columns = 3,
  background = "white" // "white" or "gray"
}) {
  return (
    <section className={`py-20 px-6 ${background === "gray" ? "bg-gray-50" : "bg-white"}`}>
      <div className="max-w-6xl mx-auto">
        <SectionHeading title={title} subtitle={subtitle} />
        
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-8`}>
          {features.map((feature, i) => (
            <FeatureCard 
              key={i}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureGridSection;