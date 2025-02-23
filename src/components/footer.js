// /components/Footer.js
export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        <span className="text-gray-600">
          &copy; 2025 Truck Command. All rights reserved.
        </span>
        <div className="space-x-4 mt-4 md:mt-0">
          <a href="/about" className="text-gray-600 hover:text-[#007BFF]">
            About
          </a>
          <a href="/contact" className="text-gray-600 hover:text-[#007BFF]">
            Contact
          </a>
          <a href="/privacy" className="text-gray-600 hover:text-[#007BFF]">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
