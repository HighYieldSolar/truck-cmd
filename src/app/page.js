"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Menu, X, ChevronDown, FileText, Truck, Wallet, 
  Users, Package, CheckCircle, Calculator, Fuel, 
  HelpCircle, Mail, MessageSquare, ArrowRight, Star
} from "lucide-react";
import { 
  FeatureGridSection, 
  TestimonialSection, 
  CTASection, 
  FAQSection 
} from "@/components/sections";

// Navigation component separated for better organization
const Navigation = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const featuresRef = useRef(null);
  const supportRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (featuresRef.current && !featuresRef.current.contains(event.target)) {
        setFeaturesOpen(false);
      }
      if (supportRef.current && !supportRef.current.contains(event.target)) {
        setSupportOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Features menu items
  const features = [
    { icon: <FileText size={20} className="text-blue-600" />, title: "Invoicing", href: "/features/invoicing", desc: "Generate and track invoices" },
    { icon: <Truck size={20} className="text-blue-600" />, title: "Dispatching", href: "/features/dispatching", desc: "Manage fleet assignments" },
    { icon: <Wallet size={20} className="text-blue-600" />, title: "Expense Tracking", href: "/features/expense-tracking", desc: "Monitor all expenses" },
    { icon: <Users size={20} className="text-blue-600" />, title: "Customer Management", href: "/features/customer-management", desc: "Organize client information" },
    { icon: <Package size={20} className="text-blue-600" />, title: "Fleet Tracking", href: "/features/fleet-tracking", desc: "Real-time vehicle locations" },
    { icon: <CheckCircle size={20} className="text-blue-600" />, title: "Compliance Reports", href: "/features/compliance", desc: "Stay DOT compliant" },
    { icon: <Calculator size={20} className="text-blue-600" />, title: "IFTA Calculator", href: "/features/ifta-calculator", desc: "Simplify tax filings" },
    { icon: <Fuel size={20} className="text-blue-600" />, title: "Fuel Tracker", href: "/features/fuel-tracker", desc: "Track fuel consumption" }
  ];

  // Support menu items
  const supports = [
    { icon: <HelpCircle size={20} className="text-blue-600" />, title: "Help Center", href: "/help" },
    { icon: <Mail size={20} className="text-blue-600" />, title: "Contact Us", href: "/contact" },
    { icon: <MessageSquare size={20} className="text-blue-600" />, title: "Feedback", href: "/feedback" }
  ];

  return (
    <nav className={`sticky top-0 z-50 flex justify-between items-center p-4 bg-white shadow-md border-b border-gray-200 transition-all duration-300 ${scrolled ? 'py-3' : 'py-4'}`}>
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/tc-name-tp-bg.png"
            alt="Truck Command Logo"
            width={120}
            height={40}
            className={`h-10 mr-3 transition-all duration-300 ${scrolled ? 'scale-95' : 'scale-100'}`}
          />
        </Link>
      </div>

      {isMobile ? (
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-gray-600 hover:text-[#00D9FF] border border-gray-300 rounded px-2 py-1 transition-colors">Login</Link>
          <Link href="/signup" className="px-1 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF] transition-colors">
            Get Started
          </Link>
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="p-2 text-gray-600 focus:outline-none"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-6">
          <div ref={featuresRef} className="relative inline-block">
            <button 
              onClick={() => {
                setFeaturesOpen(!featuresOpen);
                setSupportOpen(false);
              }} 
              className="flex items-center text-gray-600 hover:text-[#00D9FF] focus:outline-none"
              aria-expanded={featuresOpen}
              aria-haspopup="true"
            >
              <span>Features</span>
              <ChevronDown size={20} className={`ml-1 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {featuresOpen && (
              <div className="absolute left-0 top-full mt-1 w-96 bg-white rounded-md shadow-lg z-20 animate-fadeIn">
                <div className="p-4 grid grid-cols-2 gap-4">
                  {features.map((feature, i) => (
                    <a 
                      key={i} 
                      href={feature.href} 
                      className="flex items-start px-4 py-3 border border-blue-100 rounded hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                    >
                      <div className="mr-3 mt-1 text-blue-500 group-hover:text-blue-700 transition-colors">
                        {feature.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                          {feature.title}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{feature.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Link href="/pricing" className="text-gray-600 hover:text-[#00D9FF] transition-colors">Pricing</Link>
          
          <div ref={supportRef} className="relative inline-block">
            <button
              onClick={() => {
                setSupportOpen(!supportOpen);
                setFeaturesOpen(false);
              }}
              className="flex items-center text-gray-600 hover:text-[#00D9FF] focus:outline-none"
              aria-expanded={supportOpen}
              aria-haspopup="true"
            >
              <span>Support</span>
              <ChevronDown size={20} className={`ml-1 transition-transform ${supportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {supportOpen && (
              <div className="absolute left-0 top-full mt-1 w-60 bg-white rounded-md shadow-lg z-20 animate-fadeIn">
                <div className="p-4 space-y-2">
                  {supports.map((support, i) => (
                    <a 
                      key={i} 
                      href={support.href} 
                      className="flex items-center px-4 py-3 border border-blue-100 rounded hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
                    >
                      <div className="mr-3 text-blue-500 group-hover:text-blue-700 transition-colors">
                        {support.icon}
                      </div>
                      <span className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                        {support.title}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Link 
            href="/login" 
            className="text-gray-600 hover:text-[#00D9FF] border border-gray-300 hover:border-[#00D9FF] rounded px-4 py-2 transition-all duration-200"
          >
            Login
          </Link>
          
          <Link 
            href="/signup" 
            className="px-4 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF] transition-colors shadow-sm hover:shadow-md"
          >
            Get Started
          </Link>
        </div>
      )}

      {/* Mobile Menu Slide-In */}
      {isMobile && (
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setMenuOpen(false)}
        />
      )}
      
      {isMobile && (
        <div className={`fixed top-0 right-0 w-72 h-full bg-white shadow-lg z-50 p-6 flex flex-col space-y-6 transition-transform duration-300 transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center">
            <Image
              src="/images/tc-name-tp-bg.png"
              alt="Truck Command Logo"
              width={100}
              height={33}
              className="h-8"
            />
            <button 
              onClick={() => setMenuOpen(false)} 
              className="text-gray-600 focus:outline-none"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <Link 
              href="/pricing" 
              className="block py-3 text-gray-700 hover:text-[#00D9FF] border-b border-gray-100" 
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </Link>
            
            <button 
              onClick={() => setFeaturesOpen(!featuresOpen)} 
              className="flex items-center justify-between w-full py-3 text-gray-700 hover:text-[#00D9FF] border-b border-gray-100 focus:outline-none"
            >
              <span>Features</span>
              <ChevronDown size={20} className={`transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {featuresOpen && (
              <div className="space-y-1 py-2 pl-4">
                {features.map((feature, i) => (
                  <Link 
                    key={i}
                    href={feature.href} 
                    className="flex items-center py-2 text-gray-600 hover:text-[#00D9FF]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="mr-2">{feature.icon}</span>
                    <span>{feature.title}</span>
                  </Link>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => setSupportOpen(!supportOpen)} 
              className="flex items-center justify-between w-full py-3 text-gray-700 hover:text-[#00D9FF] border-b border-gray-100 focus:outline-none"
            >
              <span>Support</span>
              <ChevronDown size={20} className={`transition-transform ${supportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {supportOpen && (
              <div className="space-y-1 py-2 pl-4">
                {supports.map((support, i) => (
                  <Link 
                    key={i}
                    href={support.href} 
                    className="flex items-center py-2 text-gray-600 hover:text-[#00D9FF]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="mr-2">{support.icon}</span>
                    <span>{support.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-auto space-y-4">
            <Link 
              href="/login" 
              className="block text-center text-gray-700 border border-gray-300 rounded-md py-3 hover:border-[#00D9FF] hover:text-[#00D9FF] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
            
            <Link 
              href="/signup" 
              className="block text-center bg-[#007BFF] text-white rounded-md py-3 hover:bg-[#00D9FF] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default function LandingPage() {
  // Features data
  const features = [
    { icon: <FileText size={58} className="text-blue-600" />, title: "Invoicing", description: "Generate, send, and manage invoices with ease for faster payments." },
    { icon: <Truck size={58} className="text-blue-600" />, title: "Dispatching", description: "Seamlessly assign and track loads to optimize routes." },
    { icon: <Wallet size={58} className="text-blue-600" />, title: "Expense Tracking", description: "Monitor fuel, maintenance, and other expenses in real-time." },
    { icon: <Users size={58} className="text-blue-600" />, title: "Customer Management", description: "Keep an organized database for streamlined communications." },
    { icon: <Package size={58} className="text-blue-600" />, title: "Fleet Tracking", description: "Track vehicle locations and maintenance schedules effectively." },
    { icon: <CheckCircle size={58} className="text-blue-600" />, title: "Compliance Reports", description: "Generate DOT and tax reports to keep your business compliant." },
    { icon: <Calculator size={58} className="text-blue-600" />, title: "IFTA Calculator", description: "Simplify fuel tax calculations across different states." },
    { icon: <Fuel size={58} className="text-blue-600" />, title: "Fuel Tracker", description: "Monitor fuel usage, track costs, and optimize efficiency." }
  ];

  // Testimonials data
  const testimonials = [
    { text: "Truck Command has revolutionized how we manage our fleet and expenses. The ease of use and real-time data are game-changers.", name: "Alex Rodriguez", role: "Fleet Manager", company: "AR Logistics", rating: 5 },
    { text: "Since switching to Truck Command, our dispatching process has become smoother and more efficient. Highly recommend!", name: "Jamie Lewis", role: "Owner-Operator", company: "Lewis Hauling", rating: 5 },
    { text: "The invoicing system is seamless. I can send and track invoices with just a few clicks. It has saved me hours of work every week!", name: "Samantha King", role: "Independent Trucker", company: "King Transport", rating: 5 },
    { text: "Fuel tracking has never been easier. Truck Command helps us monitor fuel expenses in real-time, making cost analysis simple.", name: "Carlos Martinez", role: "Fleet Owner", company: "CM Freight", rating: 5 },
    { text: "Customer management and compliance tracking are lifesavers. We can keep up with DOT requirements effortlessly!", name: "Linda Parker", role: "Logistics Coordinator", company: "Parker Shipping", rating: 5 },
    { text: "This platform has changed the way we run our trucking business. The insights help us optimize operations and maximize profits.", name: "David Smith", role: "Dispatch Manager", company: "Smith Trucking", rating: 5 }
  ];

  // FAQ data
  const faqs = [
    {
      question: "How does the free trial work?",
      answer: "Your 7-day free trial gives you full access to all features. No credit card required until you decide to continue. You can cancel anytime during the trial period."
    },
    {
      question: "Is there a mobile app available?",
      answer: "Yes! Truck Command offers both iOS and Android apps so you can manage your business on the go. All features are accessible from mobile devices."
    },
    {
      question: "Can I import my existing customer data?",
      answer: "Absolutely. Our platform supports easy importing of customer lists, vehicle information, and other data from spreadsheets or other management systems."
    },
    {
      question: "How secure is my business data?",
      answer: "We use industry-standard encryption and security practices to protect your data. All information is stored in secure cloud servers with regular backups."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes, we provide 24/7 customer support via chat, email, and phone. Our support team consists of trucking industry experts who understand your business needs."
    }
  ];

  // Smooth scroll function for navigation
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-6 bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#222222] leading-tight">
                Simplify Your <span className="text-[#007BFF]">Trucking Business</span>
              </h1>
              <p className="text-xl text-[#4A4A4A] mt-6 max-w-xl">
                Manage invoices, expenses, dispatching, IFTA calculations, and customer relationships—all in one easy-to-use platform.
              </p>
              <h3 className="text-2xl font-semibold text-[#007BFF] mt-6">
                Efficiency in Motion, Profit in Command
              </h3>
              <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
                <a
                  href="/signup"
                  className="px-8 py-4 bg-[#007BFF] text-white rounded-md text-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:bg-[#0066CC] flex items-center justify-center"
                >
                  Get Started Free 
                  <ArrowRight size={20} className="ml-2" />
                </a>
                <a
                  href="#how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('how-it-works');
                  }}
                  className="px-8 py-4 bg-white text-[#007BFF] border border-[#007BFF] rounded-md text-xl transition-all duration-300 hover:bg-blue-50"
                >
                  Learn More
                </a>
              </div>
              <div className="mt-6 text-sm text-gray-600">
                No credit card required • Free 7-day trial
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative w-full h-64 md:h-96 bg-white rounded-lg shadow-xl overflow-hidden">
                {/* Placeholder for dashboard image */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-white opacity-50"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-lg text-gray-500">Dashboard Preview</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-500 rounded-full opacity-20"></div>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-300 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
        
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full filter blur-3xl opacity-10 transform -translate-x-1/2 translate-y-1/2"></div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-lg text-gray-500 mb-8">Trusted by hundreds of trucking companies across North America</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
            {/* Placeholder for company logos */}
            {[1, 2, 3, 4, 5].map(index => (
              <div key={index} className="h-12 w-32 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-400">Logo {index}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#222222] mb-4 inline-block relative">
              How It Works
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded"></div>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get your trucking business organized in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-blue-200 -z-10 transform -translate-y-1/2"></div>
            
            {[
              {
                step: "1",
                title: "Sign Up & Set Up",
                description: "Create your account and configure your company details in minutes. Our guided setup ensures you're ready to go quickly."
              },
              {
                step: "2",
                title: "Manage Your Fleet",
                description: "Track loads, dispatch trucks, and keep tabs on expenses with real-time updates. Stay connected with your team on the go."
              },
              {
                step: "3",
                title: "Optimize & Grow",
                description: "Access data-driven insights and reports to improve your operational efficiency and boost your bottom line."
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="p-8 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500 text-white text-2xl font-bold flex items-center justify-center mb-6 shadow-md">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-semibold text-[#222222] mb-4">
                    {item.title}
                  </h3>
                  <p className="text-[#4A4A4A]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeatureGridSection
        title="Simple & Efficient Trucking Management"
        subtitle="All the tools you need to run your trucking business efficiently in one platform"
        features={features}
        columns={3}
        background="gray"
      />

      {/* Testimonials Section */}
      <TestimonialSection
        title="What Our Customers Say"
        subtitle="Join hundreds of satisfied trucking professionals who've transformed their business"
        testimonials={testimonials}
        background="white"
      />

      {/* Pricing CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to streamline your trucking operations?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Choose the plan that fits your business size. All plans include our core features.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <a href="/pricing" className="inline-block px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg text-xl shadow-md hover:bg-blue-50 transition-all duration-300">
              View Pricing Plans
            </a>
            <a href="/signup" className="inline-block px-8 py-4 bg-blue-900 text-white font-semibold rounded-lg text-xl shadow-md hover:bg-blue-950 transition-all duration-300">
              Start Free Trial
            </a>
          </div>
          <p className="mt-6 text-blue-200">No credit card required • 7-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection
        title="Frequently Asked Questions"
        faqs={faqs}
        contactCTA={true}
        background="gray"
      />

      {/* Call-to-Action Section */}
      <CTASection
        title="Start Managing Your Business Better"
        description="Join thousands of trucking businesses that have increased their efficiency and profitability with Truck Command."
        primaryButtonText="Start Your Free Trial Now"
        footnote="No credit card required • Cancel anytime"
      />

      {/* Footer */}
      <footer className="bg-[#222222] text-white pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <Image
                src="/images/tc-name-tp-bg.png"
                alt="Truck Command Logo"
                width={150}
                height={50}
                className="h-12 mb-6"
              />
              <p className="text-gray-400 mb-4">
                Efficiency in Motion, Profit in Command
              </p>
              <div className="flex space-x-4">
                {/* Social media icons would go here */}
                <a href="#" className="text-gray-400 hover:text-white transition-colors">FB</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">TW</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">IG</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">LI</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-3">
                <li><a href="/features/invoicing" className="text-gray-400 hover:text-white transition-colors">Invoicing</a></li>
                <li><a href="/features/dispatching" className="text-gray-400 hover:text-white transition-colors">Dispatching</a></li>
                <li><a href="/features/expense-tracking" className="text-gray-400 hover:text-white transition-colors">Expense Tracking</a></li>
                <li><a href="/features/fleet-tracking" className="text-gray-400 hover:text-white transition-colors">Fleet Tracking</a></li>
                <li><a href="/features/compliance" className="text-gray-400 hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-3">
                <li><a href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/terms" className="text-gray-400 hover:text-white transition-colors">Feedback</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">&copy; {new Date().getFullYear()} Truck Command. All rights reserved.</p>
            <div className="flex space-x-4">
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}