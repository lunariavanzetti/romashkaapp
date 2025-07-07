import React from 'react';
import { Button } from '../components/ui';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const stats = [
  { label: 'Automation', value: 70, suffix: '%' },
  { label: 'Avg. Response', value: 6, suffix: 's' },
];

const features = [
  'AI-powered chat automation',
  'Real-time analytics',
  'Multi-channel support',
  'Easy knowledge base',
];

const testimonials = [
  { name: 'Alice', text: 'ROMASHKA transformed our support!', company: 'Acme Inc.' },
  { name: 'Bob', text: 'Super fast and easy to use.', company: 'Beta LLC' },
  { name: 'Carol', text: 'Our team loves the automation.', company: 'Gamma Co.' },
];

const pricing = [
  { tier: 'Free', price: '$0', features: ['Basic automation', 'Community support'] },
  { tier: 'Pro', price: '$29/mo', features: ['All Free features', 'Advanced analytics', 'Priority support'] },
  { tier: 'Enterprise', price: 'Contact us', features: ['Custom integrations', 'Dedicated manager'] },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-pink via-primary-purple to-primary-green dark:from-dark dark:via-primary-purple dark:to-primary-green flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl px-4 py-24 flex flex-col items-center text-center relative">
        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="font-heading text-5xl md:text-6xl font-bold text-white drop-shadow-lg mb-6">
          Automate Customer Conversations with <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-pink to-primary-green">ROMASHKA</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="text-xl md:text-2xl text-white/90 mb-8">
          AI-powered, real-time, and beautifully simple.
        </motion.p>
        <div className="flex gap-4 mb-12">
          {user ? (
            <Button 
              variant="primary" 
              className="shadow-xl bg-gradient-to-r from-primary-pink to-primary-purple hover:from-primary-purple hover:to-primary-pink dark:from-primary-green dark:to-primary-lavender dark:hover:from-primary-lavender dark:hover:to-primary-green transition-all duration-300 transform hover:scale-105" 
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          ) : (
            <Button 
              variant="primary" 
              className="shadow-xl bg-gradient-to-r from-primary-pink to-primary-purple hover:from-primary-purple hover:to-primary-pink dark:from-primary-green dark:to-primary-lavender dark:hover:from-primary-lavender dark:hover:to-primary-green transition-all duration-300 transform hover:scale-105" 
              onClick={() => navigate('/signup')}
            >
              Get Started
            </Button>
          )}
          <Button 
            variant="secondary" 
            className="shadow-xl bg-gradient-to-r from-primary-green to-primary-lavender hover:from-primary-lavender hover:to-primary-green dark:from-primary-pink dark:to-primary-purple dark:hover:from-primary-purple dark:hover:to-primary-pink transition-all duration-300 transform hover:scale-105" 
            onClick={() => navigate('/pricing')}
          >
            See Pricing
          </Button>
        </div>
        {/* Animated Stats */}
        <div className="flex gap-8 justify-center mb-12">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.2 }} className="glass-card px-8 py-6 rounded-2xl shadow-lg text-white">
              <div className="text-4xl font-bold">
                <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
                  {stat.value}
                </motion.span>{stat.suffix}
              </div>
              <div className="text-lg mt-2 opacity-80">{stat.label}</div>
            </motion.div>
          ))}
        </div>
        {/* Features Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 w-full">
          {features.map((feature, i) => (
            <motion.div key={feature} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="glass-card p-6 rounded-xl shadow-md text-white text-lg">
              {feature}
            </motion.div>
          ))}
        </div>
      </section>
      {/* Testimonials Carousel */}
      <section className="w-full max-w-3xl px-4 py-12">
        <h2 className="font-heading text-3xl text-white mb-6">What our users say</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {testimonials.map((t, i) => (
            <motion.div key={i} className="glass-card min-w-[260px] p-6 rounded-xl shadow-md text-white" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 * i }}>
              <div className="text-lg mb-2">“{t.text}”</div>
              <div className="font-bold">{t.name}</div>
              <div className="text-sm opacity-70">{t.company}</div>
            </motion.div>
          ))}
        </div>
      </section>
      {/* Pricing Preview */}
      <section className="w-full max-w-4xl px-4 py-12">
        <h2 className="font-heading text-3xl text-white mb-6">Pricing</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          {pricing.map((tier, i) => (
            <motion.div key={tier.tier} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 * i }} className="glass-card flex-1 p-8 rounded-2xl shadow-lg text-white flex flex-col items-center">
              <div className="font-heading text-2xl mb-2">{tier.tier}</div>
              <div className="text-3xl font-bold mb-4">{tier.price}</div>
              <ul className="mb-6 space-y-1">
                {tier.features.map((f) => <li key={f}>• {f}</li>)}
              </ul>
              <Button variant={i === 1 ? 'primary' : 'outline'}>Choose</Button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
} 