import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      text: "MatchMate helped me find amazing people to discuss my interests with. The voice calls feel so natural!",
      author: "Alex",
      role: "Software Developer",
      avatar: "👨‍💻",
      rating: 5,
    },
    {
      text: "I was skeptical at first, but the conversations here are genuinely meaningful. No pressure, just good talks.",
      author: "Sarah",
      role: "Student",
      avatar: "👩‍🎓",
      rating: 5,
    },
    {
      text: "The instant matching is incredible! Found someone to discuss philosophy with in seconds.",
      author: "Mike",
      role: "Writer",
      avatar: "✍️",
      rating: 5,
    },
    {
      text: "Best anonymous chat platform I've used. The audio quality is amazing and no lag!",
      author: "Priya",
      role: "Musician",
      avatar: "🎵",
      rating: 5,
    },
  ];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Loved by Our Community
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          See what our users are saying about MatchMate
        </p>
      </motion.div>

      <div className="relative max-w-4xl mx-auto">
        {/* Main Testimonial Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 
                          border border-slate-200 dark:border-slate-800
                          shadow-2xl">

              {/* Quote Icon */}
              <div className="text-6xl text-indigo-200 dark:text-indigo-800 mb-6">"</div>

              {/* Testimonial Text */}
              <p className="text-xl text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                {testimonials[currentIndex].text}
              </p>

              {/* Author Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 
                                rounded-2xl flex items-center justify-center text-3xl">
                    {testimonials[currentIndex].avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                      {testimonials[currentIndex].author}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400">
                      {testimonials[currentIndex].role}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <button
          onClick={prevTestimonial}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12
                     w-12 h-12 bg-white dark:bg-slate-800 rounded-full 
                     shadow-lg hover:shadow-xl flex items-center justify-center
                     transition-all duration-300 hover:scale-110
                     border border-slate-200 dark:border-slate-700"
        >
          ←
        </button>

        <button
          onClick={nextTestimonial}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12
                     w-12 h-12 bg-white dark:bg-slate-800 rounded-full 
                     shadow-lg hover:shadow-xl flex items-center justify-center
                     transition-all duration-300 hover:scale-110
                     border border-slate-200 dark:border-slate-700"
        >
          →
        </button>

        {/* Dots Indicator */}
        <div className="flex justify-center space-x-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                ? 'w-8 bg-indigo-600'
                : 'bg-slate-300 dark:bg-slate-700'
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;