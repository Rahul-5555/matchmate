import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LANGUAGES } from '../utils/constants';

const LanguageSelector = ({ onSelect, initialLanguage = 'hi-en' }) => {
  const [selected, setSelected] = useState(initialLanguage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl max-w-md mx-auto"
    >
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        🗣️ पहले भाषा चुनें / Select Language
      </h3>

      <div className="space-y-3 mb-6">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${selected === lang.code
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
          >
            <span className="text-3xl">{lang.flag}</span>
            <div className="text-left">
              <div className={`font-semibold ${selected === lang.code
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-900 dark:text-white'
                }`}>
                {lang.name}
              </div>
              <div className="text-sm text-slate-500">
                {lang.englishName}
              </div>
            </div>
            {selected === lang.code && (
              <span className="ml-auto text-indigo-600">✓</span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => onSelect(selected)}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600
                   text-white rounded-xl font-semibold text-lg
                   hover:shadow-xl transform hover:scale-105 transition-all"
      >
        Continue →
      </button>
    </motion.div>
  );
};

export default LanguageSelector;