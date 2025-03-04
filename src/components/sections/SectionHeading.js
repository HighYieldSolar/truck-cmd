"use client";

export function SectionHeading({ title, subtitle }) {
  return (
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 inline-block relative">
        {title}
        <div className="absolute bottom-0 left-0 right-0 mx-auto w-1/4 h-1 bg-blue-500 rounded"></div>
      </h2>
      {subtitle && (
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;