import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GENDER_FILTER_PRICE, MESSAGES } from '../utils/constants';

const PaymentModal = ({ isOpen, onClose, onSuccess, language = 'hi-en' }) => {
  const [loading, setLoading] = useState(false);
  const t = MESSAGES[language] || MESSAGES['hi-en'];

  // 🔥 TEST MODE - Direct activation without real payment
  const handleTestPayment = () => {
    setLoading(true);

    console.log("🧪 Test payment clicked - activating premium...");

    // Call simulate payment API
    fetch('http://localhost:5000/api/simulate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: localStorage.getItem('matchmate_permanent_session'),
        amount: GENDER_FILTER_PRICE
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('premium_token', data.token);
          localStorage.setItem('premium_until', data.expiresAt);
          onSuccess(data);
          onClose();
          alert("✅ Test payment successful! Premium activated for 24 hours.");
        }
      })
      .catch(err => {
        console.error("❌ Test payment error:", err);
        alert("❌ Test payment failed. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] 
                     flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3 animate-bounce">🧪</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Test Mode
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Click button to activate premium (TEST)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ This is test mode. No real payment will be charged.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <span>✓</span>
                <span>24 hours unlimited gender filter</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <span>✓</span>
                <span>Instant activation (test mode)</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <span>✓</span>
                <span>No real money involved</span>
              </div>
            </div>

            {/* Test Pay Button */}
            <button
              onClick={handleTestPayment}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600
                       text-white rounded-xl font-semibold text-lg
                       hover:shadow-xl transition-all disabled:opacity-50
                       flex items-center justify-center gap-2 mb-3"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⚡</span>
                  Activating...
                </>
              ) : (
                "🧪 Test Pay ₹1 (No real payment)"
              )}
            </button>

            {/* Cancel */}
            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
              disabled={loading}
            >
              Cancel
            </button>

            {loading && (
              <p className="mt-4 text-xs text-center text-indigo-600 animate-pulse">
                ⏳ Activating premium...
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;