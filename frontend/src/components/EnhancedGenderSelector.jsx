import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GENDERS, GENDER_LABELS, GENDER_FILTER_PRICE, MESSAGES } from '../utils/constants';
import PaymentModal from './PaymentModal';

const EnhancedGenderSelector = ({
  onSelect,
  initialPreference,
  hasPremium = false,  // 👈 YEH IMPORTANT HAI
  language = 'hi-en'
}) => {
  const [myGender, setMyGender] = useState(initialPreference?.myGender || GENDERS.MALE);
  const [lookingFor, setLookingFor] = useState(initialPreference?.lookingFor || GENDERS.BOTH);
  const [showPayment, setShowPayment] = useState(false);

  const t = MESSAGES[language] || MESSAGES['hi-en'];

  const handleFindMatch = () => {
    // Agar "both" selected hai to FREE
    if (lookingFor === GENDERS.BOTH) {
      onSelect({ myGender, lookingFor, language });
      return;
    }

    // 🔥 FIX: Agar PREMIUM hai to direct match, payment mat dikhao
    if (hasPremium) {
      console.log("✨ Premium user - skipping payment");
      onSelect({ myGender, lookingFor, language });
      return;
    }

    // Agar PREMIUM nahi hai to payment dikhao
    console.log("💰 Non-premium user - showing payment");
    setShowPayment(true);
  };

  const handlePaymentSuccess = (data) => {
    setShowPayment(false);
    onSelect({ myGender, lookingFor, language }, true); // true = paid
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl max-w-md mx-auto"
      >
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          🎯 {t.selectGender}
        </h3>

        {/* I am (My Gender) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t.selectGender}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[GENDERS.MALE, GENDERS.FEMALE].map((gender) => (
              <button
                key={gender}
                onClick={() => setMyGender(gender)}
                className={`p-3 rounded-xl border-2 transition-all ${myGender === gender
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
              >
                <span className="text-2xl block mb-1">
                  {gender === GENDERS.MALE ? '👨' : '👩'}
                </span>
                <span className={`text-sm font-medium ${myGender === gender
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400'
                  }`}>
                  {GENDER_LABELS[gender]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Looking For */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t.lookingFor}
          </label>
          <div className="space-y-2">
            {[GENDERS.MALE, GENDERS.FEMALE, GENDERS.BOTH].map((gender) => (
              <button
                key={gender}
                onClick={() => setLookingFor(gender)}
                className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${lookingFor === gender
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {gender === GENDERS.MALE ? '👨' : gender === GENDERS.FEMALE ? '👩' : '👥'}
                  </span>
                  <span className={`font-medium ${lookingFor === gender
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400'
                    }`}>
                    {GENDER_LABELS[gender]}
                  </span>
                </div>

                {gender !== GENDERS.BOTH && (
                  <span className={`text-xs px-2 py-1 rounded-full ${hasPremium
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                    {hasPremium ? '✅ Premium' : `₹${GENDER_FILTER_PRICE}/day`}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Premium Status - Visible for premium users */}
        {hasPremium && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl text-sm">
            <p className="text-green-700 dark:text-green-300 flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span className="font-medium">Premium Active • 24h unlimited access</span>
            </p>
          </div>
        )}

        {/* Find Match Button */}
        <button
          onClick={handleFindMatch}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600
                   text-white rounded-xl font-semibold text-lg
                   hover:shadow-xl transform hover:scale-105 transition-all"
        >
          {lookingFor === GENDERS.BOTH
            ? '✨ Find Match (Free)'
            : hasPremium
              ? '💎 Find Match (Premium)'
              : `💎 Find Match (₹${GENDER_FILTER_PRICE})`}
        </button>

        {/* Skip for now link */}
        <button
          onClick={() => onSelect({ myGender: GENDERS.MALE, lookingFor: GENDERS.BOTH, language })}
          className="w-full mt-3 text-sm text-slate-500 dark:text-slate-400 
                     hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          Skip for now (Both genders)
        </button>
      </motion.div>

      {/* Payment Modal - Sirf tab dikhega jab premium nahi hai */}
      {showPayment && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          language={language}
        />
      )}
    </>
  );
};

export default EnhancedGenderSelector;