import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import { Map, Zap, Shield, Globe } from 'lucide-react';

const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 py-8 px-4 border-t border-slate-800">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-xl font-black text-white flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary fill-primary" />
        TravelFlow
      </div>
      <div className="text-sm font-medium text-slate-400">
        Developed by:{' '}
        <a href="/" className="text-primary hover:text-indigo-400 font-bold transition-colors underline decoration-2 underline-offset-4">
          Arvish, Ashish, Balram, Ayush
        </a>
      </div>
    </div>
  </footer>
);

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group">
    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      
      {/* Features Section */}
      <section className="py-24 px-4 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Travel Smarter, Not Harder</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Our advanced routing technology handles the logistics while you focus on the memories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Map} 
              title="Smart Routing" 
              desc="Optimized travel sequences that minimize backtracking and maximize sightseeing time." 
            />
            <FeatureCard 
              icon={Shield} 
              title="Budget Control" 
              desc="Real-time cost breakdowns for Stay, Transport, and Food across 3 different tiers." 
            />
            <FeatureCard 
              icon={Globe} 
              title="India & Beyond" 
              desc="Comprehensive coverage of all 28 Indian States and 8 Union Territories with dynamic data." 
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
