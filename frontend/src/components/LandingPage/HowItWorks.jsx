import React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const HowItWorks = () => {
  const steps = [
    {
      icon: '🎯',
      title: 'Choose Interest',
      description: 'Pick a topic you want to discuss from our curated interests',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      shadow: 'shadow-blue-500/20',
      features: ['100+ interests', 'Smart suggestions', 'Popular topics']
    },
    {
      icon: '🔄',
      title: 'Get Matched',
      description: 'Our smart algorithm connects you with someone who shares your interest',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      shadow: 'shadow-purple-500/20',
      features: ['< 2 second match', 'Global community', 'Safe matching']
    },
    {
      icon: '💭',
      title: 'Start Talking',
      description: 'Chat via text or voice - completely anonymous and private',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      shadow: 'shadow-orange-500/20',
      features: ['Text chat', 'HD Voice calls', 'End-to-end encrypted']
    },
  ];

  // Floating animation for icons
  const floatingIcons = ['✨', '💫', '⭐', '🌟', '⚡', '💬', '🎤', '🔊'];

  return (
    <div className="py-24 relative overflow-hidden">
      {/* Background Floating Icons */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingIcons.map((icon, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl opacity-10 dark:opacity-5"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * 600,
              scale: 0.5
            }}
            animate={{
              y: [null, -30, 30, -30, 30, -30, 0],
              x: [null, 20, -20, 20, -20, 20, 0],
              rotate: [0, 180, 360],
              scale: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 20 + i * 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {icon}
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, type: "spring" }}
        className="relative z-10"
      >
        {/* Section Header */}
        <div className="text-center mb-20">
          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-block mb-6"
          >
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/30">
              ✨ Simple 3-Step Process
            </span>
          </motion.div>

          {/* Title with animated gradient */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              How It Works
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto"
          >
            Three simple steps to start meaningful conversations with people who share your interests
          </motion.p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 relative">
          {/* Animated Connection Lines */}
          <svg className="hidden md:block absolute top-1/3 left-0 w-full h-32 pointer-events-none">
            <motion.path
              d="M 150 100 L 400 100 L 650 100"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: 0.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.3,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{
                y: -15,
                transition: { type: "spring", bounce: 0.4 }
              }}
              className="relative group"
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-3xl opacity-0 
                              group-hover:opacity-20 blur-xl transition-opacity duration-500`} />

              {/* Main Card */}
              <div className={`relative bg-white dark:bg-slate-900 rounded-3xl p-8 
                            border border-slate-200 dark:border-slate-800
                            shadow-xl hover:shadow-2xl transition-all duration-500
                            ${step.shadow} hover:shadow-2xl`}>

                {/* Floating Number Badge */}
                <motion.div
                  className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl 
                             bg-gradient-to-r from-indigo-600 to-purple-600
                             flex items-center justify-center text-white font-bold text-lg
                             shadow-xl shadow-indigo-500/30 z-10"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ type: "spring" }}
                >
                  {index + 1}
                </motion.div>

                {/* Icon Container */}
                <motion.div
                  className={`text-7xl mb-6 p-4 inline-block rounded-3xl ${step.bgColor}`}
                  whileHover={{
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: 1.1,
                    transition: { duration: 0.5 }
                  }}
                >
                  {step.icon}
                </motion.div>

                {/* Title */}
                <motion.h3
                  className="text-3xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 
                             dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring" }}
                >
                  {step.title}
                </motion.h3>

                {/* Description */}
                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  {step.description}
                </p>

                {/* Feature List */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.2 }}
                  className="space-y-2"
                >
                  {step.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2 text-sm"
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.7 + i * 0.1 + index * 0.2 }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.color}`} />
                      <span className="text-slate-500 dark:text-slate-500">{feature}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Bottom Gradient Bar */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color} 
                              rounded-b-3xl opacity-0 group-hover:opacity-100`}
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Decorative Background Blur */}
                <div className={`absolute bottom-4 right-4 w-24 h-24 bg-gradient-to-r ${step.color} 
                                rounded-full opacity-5 blur-2xl`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="text-center mt-20"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 
                       text-white rounded-2xl font-semibold text-lg
                       shadow-xl shadow-indigo-500/30 hover:shadow-2xl 
                       hover:shadow-indigo-500/40 transition-all duration-300
                       flex items-center gap-3 mx-auto group"
          >
            <span>✨ Start Your First Conversation</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="group-hover:translate-x-1 transition-transform"
            >
              →
            </motion.span>
          </motion.button>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-8 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>1,234 online now</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span>50K+ conversations today</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HowItWorks;