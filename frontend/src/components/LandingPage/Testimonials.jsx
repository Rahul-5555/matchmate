import React, { useState, useEffect, useRef } from 'react';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const mountedRef = useRef(true);

  const testimonials = [
    {
      text: "MatchMate helped me find amazing people to discuss my interests with. The voice calls feel so natural!",
      author: "Alex",
      role: "Software Developer",
      avatar: "👨‍💻",
    },
    {
      text: "I was skeptical at first, but the conversations here are genuinely meaningful. No pressure, just good talks.",
      author: "Sarah",
      role: "Student",
      avatar: "👩‍🎓",
    },
    {
      text: "The instant matching is incredible! Found someone to discuss philosophy with in seconds.",
      author: "Mike",
      role: "Writer",
      avatar: "✍️",
    },
    {
      text: "Best anonymous chat platform I've used. The audio quality is amazing and no lag!",
      author: "Priya",
      role: "Musician",
      avatar: "🎵",
    },
  ];

  // Auto-slide functionality - FIXED
  useEffect(() => {
    mountedRef.current = true;
    // console.log("🔄 Auto-slide started");

    const interval = setInterval(() => {
      if (mountedRef.current) {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % testimonials.length;
          // console.log(`Sliding from ${prev} to ${next}`);
          return next;
        });
      }
    }, 5000);

    return () => {
      console.log("🧹 Auto-slide cleaned up");
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []); // ✅ Empty dependency array - runs only once

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          Loved by Our Community
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-400">
          See what our users are saying about MatchMate
        </p>
      </div>

      {/* Testimonial Card with Buttons */}
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          {/* Testimonial Card */}
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 
                      border border-slate-200 dark:border-slate-800
                      shadow-xl transition-all duration-500"
          >
            {/* Quote Icon */}
            <div className="text-4xl text-indigo-300 dark:text-indigo-700 mb-3">
              "
            </div>

            {/* Testimonial Text */}
            <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
              {testimonials[currentIndex].text}
            </p>

            {/* Author Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 
                              rounded-xl flex items-center justify-center text-2xl">
                  {testimonials[currentIndex].avatar}
                </div>

                {/* Name & Role */}
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {testimonials[currentIndex].author}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {testimonials[currentIndex].role}
                  </p>
                </div>
              </div>

              {/* 5 Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Buttons - Right Side */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 -mr-12">
            {/* <button
              onClick={prevTestimonial}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 
                       shadow-lg hover:shadow-xl flex items-center justify-center
                       text-slate-600 dark:text-slate-300
                       border border-slate-200 dark:border-slate-700
                       transition-all hover:scale-110 active:scale-95"
              aria-label="Previous testimonial"
            >
              ↑
            </button> */}

            {/* <button
              onClick={nextTestimonial}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 
                       shadow-lg hover:shadow-xl flex items-center justify-center
                       text-slate-600 dark:text-slate-300
                       border border-slate-200 dark:border-slate-700
                       transition-all hover:scale-110 active:scale-95"
              aria-label="Next testimonial"
            >
              ↓
            </button> */}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                ? 'w-6 bg-indigo-600'
                : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;