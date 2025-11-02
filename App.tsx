
import React from 'react';
import Header from './components/Header';
import ImageEditor from './components/ImageEditor';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-6 md:py-10">
        <ImageEditor />
      </main>
      <footer className="text-center py-4 text-slate-500 text-sm">
        <p>Powered by Gemini 2.5 Flash Image</p>
      </footer>
    </div>
  );
};

export default App;
