
import React, { useState, useRef, useCallback } from 'react';
import { editImage } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface ImageState {
  url: string;
  base64: string;
  mimeType: string;
}

const ImageEditor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
        const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
        setOriginalImage({ url: dataUrl, base64, mimeType });
        setGeneratedImageUrl(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleGenerate = useCallback(async () => {
    if (!originalImage || !prompt.trim()) {
      setError("Please upload an image and provide an editing prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const resultUrl = await editImage(originalImage.base64, originalImage.mimeType, prompt);
      setGeneratedImageUrl(resultUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);

  const handleDownload = () => {
    if (generatedImageUrl) {
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.download = `edited-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left Panel: Controls */}
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 space-y-6 flex flex-col h-full">
        <div className="flex-grow">
          <label className="block text-lg font-semibold mb-2 text-cyan-400">1. Upload Image</label>
          <div
            className="relative border-2 border-dashed border-slate-600 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-500 transition-colors duration-300 min-h-[200px] flex items-center justify-center bg-slate-900/50"
            onClick={handleUploadClick}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
            />
            {originalImage ? (
              <img src={originalImage.url} alt="Original" className="max-h-64 object-contain rounded-lg mx-auto" />
            ) : (
              <div className="text-slate-400">
                <UploadIcon className="w-12 h-12 mx-auto mb-2" />
                <p>Click to upload an image</p>
                <p className="text-xs mt-1">PNG, JPG, WEBP</p>
              </div>
            )}
          </div>
        </div>

        {originalImage && (
          <div className="flex-grow">
            <label htmlFor="prompt" className="block text-lg font-semibold mb-2 text-cyan-400">2. Describe Your Edit</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Add a retro filter', 'Make the background blurry', 'Turn this into a fantasy landscape'"
              className="w-full h-32 p-3 bg-slate-900/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
              rows={4}
            />
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!originalImage || !prompt || isLoading}
          className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
        >
          {isLoading ? <SpinnerIcon /> : <SparklesIcon />}
          <span>{isLoading ? 'Generating...' : 'Generate Image'}</span>
        </button>
      </div>

      {/* Right Panel: Result */}
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 min-h-[400px] lg:min-h-0 flex flex-col justify-between h-full">
        <div>
          <h2 className="text-lg font-semibold mb-4 text-cyan-400">Result</h2>
          <div className="relative aspect-square bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700/50">
            {isLoading && (
              <div className="flex flex-col items-center text-slate-400">
                <SpinnerIcon className="w-10 h-10" />
                <p className="mt-2">Editing your image...</p>
              </div>
            )}
            {error && !isLoading && (
              <div className="text-red-400 p-4 text-center">
                <p className="font-semibold">Generation Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
            {!isLoading && !error && generatedImageUrl && (
              <img src={generatedImageUrl} alt="Generated" className="object-contain w-full h-full rounded-lg" />
            )}
            {!isLoading && !error && !generatedImageUrl && (
              <p className="text-slate-500">Your edited image will appear here</p>
            )}
          </div>
        </div>
        {generatedImageUrl && !isLoading && (
          <button
            onClick={handleDownload}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300"
          >
            <DownloadIcon />
            <span>Download Image</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;
