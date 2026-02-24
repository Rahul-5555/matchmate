import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GENDERS, GENDER_LABELS, GENDER_FILTER_PRICE } from '../utils/constants';

const GenderSelector = ({ onSelect, initialPreference, showPayment }) => {
  const [myGender, setMyGender] = useState(initialPreference?.myGender || GENDERS.MALE);
  const [lookingFor, setLookingFor] = useState(initialPreference?.lookingFor || GENDERS.BOTH);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleFindMatch = () => {
    // Agar both selected hai to payment nahi chahiye
    if (lookingFor === GENDERS.BOTH) {
      onSelect({ myGender, lookingFor });
      return;
    }

    // Agar filter lagana hai to payment check karo
    if (showPayment) {
      setShowPaymentModal(true);
    } else {
      onSelect({ myGender, lookingFor });
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    onSelect({ myGender, lookingFor }, true); // true = paid
  };

  return (
    <>
      {/* Main Selector Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl max-w-md mx-auto"
      >
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          🎯 Who do you want to talk to?
        </h3>

        {/* I am (My Gender) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            I am a
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
            Looking for
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
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 
                                 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
                    ₹{GENDER_FILTER_PRICE}/day
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm">
          <p className="text-blue-700 dark:text-blue-300">
            💡 <span className="font-semibold">Pro Tip:</span>{' '}
            {lookingFor === GENDERS.BOTH
              ? 'No filter = Free matches. Pay ₹1 to choose gender!'
              : 'You selected gender filter. ₹1 for unlimited chats today!'}
          </p>
        </div>

        {/* Find Match Button */}
        <button
          onClick={handleFindMatch}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600
                   text-white rounded-xl font-semibold text-lg
                   hover:shadow-xl transform hover:scale-105 transition-all"
        >
          {lookingFor === GENDERS.BOTH
            ? '✨ Find Match (Free)'
            : `💎 Find Match (₹${GENDER_FILTER_PRICE})`}
        </button>

        {/* Skip for now link */}
        <button
          onClick={() => onSelect({ myGender: GENDERS.MALE, lookingFor: GENDERS.BOTH })}
          className="w-full mt-3 text-sm text-slate-500 dark:text-slate-400 
                     hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          Skip for now (Both genders)
        </button>
      </motion.div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
                       flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                ₹{GENDER_FILTER_PRICE} for 24 Hours
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Pay once, chat all day with your preferred gender!
              </p>

              {/* Payment Options */}
              <div className="space-y-3 mb-6">
                <button className="w-full p-4 bg-indigo-50 dark:bg-indigo-900/20 
                                   rounded-xl flex items-center justify-between
                                   hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📱</span>
                    <span className="font-medium">UPI / PhonePe</span>
                  </div>
                  <span className="text-indigo-600">Pay →</span>
                </button>

                <button className="w-full p-4 bg-slate-50 dark:bg-slate-800 
                                   rounded-xl flex items-center justify-between
                                   hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💳</span>
                    <span className="font-medium">Card / NetBanking</span>
                  </div>
                  <span className="text-slate-600">Pay →</span>
                </button>
              </div>

              {/* Mock Success Button (for testing) */}
              <button
                onClick={handlePaymentSuccess}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-medium
                         hover:bg-green-700 transition"
              >
                Simulate Payment Success
              </button>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GenderSelector;