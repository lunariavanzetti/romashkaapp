import React from 'react';
import { Button } from '../components/ui';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ArrowRight, CheckCircle, Zap, Shield, Globe } from 'lucide-react';

const stats = [
  { label: 'Resolution Rate', value: 90, suffix: '%' },
  { label: 'Response Time', value: 6, suffix: 's' },
  { label: 'Customer Satisfaction', value: 4.9, suffix: '/5' },
  { label: 'Cost Reduction', value: 60, suffix: '%' },
];

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'AI-Powered Automation',
    description: 'Transform your customer service with AI that actually understands context and provides helpful responses.'
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Multi-Channel Support',
    description: 'Seamlessly connect with customers across WhatsApp, Messenger, Email, and your website.'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Enterprise Security',
    description: 'Bank-grade security with SOC 2 compliance and advanced data protection.'
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    title: 'Real-Time Analytics',
    description: 'Gain deep insights into customer behavior and optimize your support strategy.'
  },
];

const testimonials = [
  { 
    name: 'Sarah Chen', 
    text: 'ROMASHKA reduced our response time by 80% while improving customer satisfaction. The AI actually understands our business context.', 
    company: 'TechFlow Solutions',
    role: 'Customer Success Manager'
  },
  { 
    name: 'Michael Rodriguez', 
    text: 'Setup was incredibly easy, and the results were immediate. Our team can now focus on complex issues instead of repetitive questions.', 
    company: 'E-Commerce Plus',
    role: 'Operations Director'
  },
  { 
    name: 'Emma Thompson', 
    text: 'The multi-channel integration is seamless. Our customers love the consistent experience across all platforms.', 
    company: 'Global Retail Co.',
    role: 'Head of Customer Experience'
  },
];

const pricing = [
  { 
    tier: 'Starter', 
    price: '$0', 
    period: 'Forever Free',
    features: ['Up to 100 conversations/month', 'Basic AI responses', 'Website widget', 'Email support'],
    popular: false
  },
  { 
    tier: 'Professional', 
    price: '$29', 
    period: 'per month',
    features: ['Up to 2,000 conversations/month', 'Advanced AI with learning', 'Multi-channel support', 'Analytics dashboard', 'Priority support'],
    popular: true
  },
  { 
    tier: 'Enterprise', 
    price: 'Custom', 
    period: 'Contact us',
    features: ['Unlimited conversations', 'Custom AI training', 'White-label solution', 'Dedicated account manager', 'SLA guarantee'],
    popular: false
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-bg-dark">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-hero animated-background"></div>
        
        <div className="relative z-10 container mx-auto px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Transform Your Customer Service with{' '}
              <span className="text-gradient-lyro">AI That Actually Understands</span>
            </h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto"
            >
              Eliminate the frustration of traditional chatbots. ROMASHKA provides genuinely helpful, 
              context-aware responses that delight your customers and free up your team.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              {user ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/dashboard')}
                  icon={<ArrowRight className="w-5 h-5" />}
                  iconPosition="right"
                  className="shadow-glow-teal"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/signup')}
                  icon={<ArrowRight className="w-5 h-5" />}
                  iconPosition="right"
                  className="shadow-glow-teal"
                >
                  Start Free Trial
                </Button>
              )}
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/pricing')}
                className="border-white/30 text-white hover:bg-white/10"
              >
                View Pricing
              </Button>
            </motion.div>
            
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-24 bg-bg-secondary dark:bg-bg-darker">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary-deep-blue dark:text-white mb-4">
              Everything You Need for Modern Customer Service
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Built for businesses that want to provide exceptional customer experiences without the complexity.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className="glass-card p-6 rounded-xl hover:shadow-elevation-3 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-button rounded-lg flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-lg font-semibold text-primary-deep-blue dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-24 bg-bg-primary dark:bg-bg-dark">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary-deep-blue dark:text-white mb-4">
              Trusted by Growing Businesses
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See how companies like yours are transforming their customer service
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className="glass-card p-6 rounded-xl hover:shadow-elevation-3 transition-all duration-300"
              >
                <div className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{testimonial.text}"
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-button rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-primary-deep-blue dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-24 bg-bg-secondary dark:bg-bg-darker">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary-deep-blue dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.map((plan, i) => (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className={`glass-card p-8 rounded-xl relative ${
                  plan.popular ? 'ring-2 ring-primary-teal shadow-glow-teal' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-button text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="font-heading text-2xl font-bold text-primary-deep-blue dark:text-white mb-2">
                    {plan.tier}
                  </h3>
                  <div className="text-4xl font-bold text-primary-deep-blue dark:text-white mb-1">
                    {plan.price}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    {plan.period}
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-teal flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  fullWidth
                  className={!plan.popular ? 'border-primary-teal text-primary-teal' : ''}
                  onClick={() => navigate('/signup')}
                >
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Transform Your Customer Service?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of businesses that trust ROMASHKA to deliver exceptional customer experiences.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/signup')}
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                className="shadow-glow-orange"
              >
                Start Your Free Trial
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/contact')}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 