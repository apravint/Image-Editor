
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

const Header: React.FC = () => {
  return (
    <header className="py-4 border-b border-slate-700/50">
      <div className="container mx-auto px-4 flex items-center justify-center">
        <SparklesIcon className="w-8 h-8 text-cyan-400 mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
          Gemini Image Editor
        </h1>
      </div>
    </header>
  );
};

export default Header;
