import React, { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, Eye } from 'lucide-react';
import { Button } from '../../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

const actions = [
  { label: 'View All', icon: <Eye size={22} />, color: 'bg-primary-green', status: 'active' },
  { label: 'Resolve', icon: <CheckCircle size={22} />, color: 'bg-primary-pink', status: 'pending' },
  { label: 'Update', icon: <RefreshCw size={22} />, color: 'bg-primary-purple', status: 'info' },
];

export default function QuickActions() {
  const [counts, setCounts] = useState([0, 0, 0]); // Start with empty counters for fresh accounts
  
  return (
    <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {actions.map((action, i) => (
        <motion.div key={action.label} whileHover={{ scale: 1.04 }} className="glass-card p-6 rounded-2xl flex flex-col items-center shadow-lg transition-all cursor-pointer">
          <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-4 ${action.color} text-white shadow-md`}>{action.icon}</div>
          <div className="font-heading text-xl mb-2">{action.label}</div>
          <AnimatePresence mode="wait">
            <motion.div key={counts[i]} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-3xl font-bold mb-2">
              {counts[i]}
            </motion.div>
          </AnimatePresence>
          <div className={`text-xs font-semibold mb-4 ${action.status === 'active' ? 'text-primary-green' : action.status === 'pending' ? 'text-primary-pink' : 'text-primary-purple'}`}>{action.status}</div>
          <Button variant="outline" className="w-full">{action.label}</Button>
        </motion.div>
      ))}
    </section>
  );
} 