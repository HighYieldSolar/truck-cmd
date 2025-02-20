export default function Home() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#222222]">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center">
          <img src="/images/TC.png" alt="Truck Command Logo" className="h-10 mr-3" />
          <div className="flex flex-col leading-none">
            <h1 className="text-2xl font-bold text-[#222222] tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Truck
            </h1>
            <h1 className="text-2xl font-bold text-[#222222] tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Command
            </h1>
          </div>
        </div>
        <div>
          <a href="/login" className="mr-4 text-gray-600 hover:text-[#00D9FF]">Login</a>
          <a href="/signup" className="px-4 py-2 bg-[#007BFF] text-white rounded-md hover:bg-[#00D9FF]">Get Started</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-20 px-6">
        <h2 className="text-4xl font-bold text-[#222222]">Simplify Your Trucking Business</h2>
        <p className="text-lg text-[#4A4A4A] mt-4 max-w-2xl">
          Manage invoices, expenses, dispatching, IFTA calculations, and customer relationships—all in one easy-to-use platform.
        </p>
        <h3 className="text-xl font-semibold text-[#007BFF] mt-4">Efficiency in Motion, Profit in Command</h3>
        <a href="/signup" className="mt-6 px-6 py-3 bg-[#007BFF] text-white rounded-md text-lg hover:bg-[#00D9FF]">
          Get Started for Free
        </a>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-[#222222]">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 px-6">
            {[
              { title: "📑 Invoicing", desc: "Generate, send, and manage invoices with ease, ensuring quick payments from clients and brokers." },
              { title: "🚚 Dispatching", desc: "Seamlessly assign and track loads, optimizing routes and improving efficiency." },
              { title: "💰 Expense Tracking", desc: "Monitor fuel, maintenance, and other expenses in real-time to optimize profitability." },
              { title: "👥 Customer Management", desc: "Maintain an organized database of clients, shippers, and brokers for streamlined communication." },
              { title: "📦 Fleet Tracking", desc: "Track vehicle locations, maintenance schedules, and driver logs to enhance operational oversight." },
              { title: "⚡ Compliance Reports", desc: "Generate DOT and tax reports, keeping your business in compliance with industry regulations." },
              { title: "⛽ IFTA Calculator", desc: "Easily calculate fuel tax based on miles driven and fuel purchased per state, simplifying tax filing." }
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-[#F5F5F5] border border-[#4A4A4A] rounded-lg shadow-md">
                <h4 className="text-xl font-semibold text-[#222222]">{feature.title}</h4>
                <p className="text-[#4A4A4A] mt-2">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Acton */}
      <section className="py-20 text-center bg-[#007BFF] text-white">
       <h3 className="text-3xl font-bold">Start Managing Your Business Better</h3>
       <p className="mt-4 text-lg">Sign up today and get a <strong>7-day free trial!</strong></p>
       <a href="/signup" className="inline-block mt-6 px-8 py-4 bg-white text-[#007BFF] font-semibold rounded-lg text-lg shadow-md hover:bg-[#00D9FF] hover:text-white transition-all duration-300"
       >
       Start Free Trial
       </a>
      </section>

      {/* Footer */}
      <footer className="text-center py-2 bg-white text-gray-600 border-t border-gray-200">
        &copy; 2025 Truck Command. All rights reserved.
      </footer>
    </main>
  );
}
