import React, { useState } from 'react';

interface CopyToClipboardProps {
  text: string;
  children: React.ReactNode;
  className?: string;
  popupText?: string;
}

const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ 
  text, 
  children, 
  className, 
  popupText = 'Copied!' 
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div
      onClick={handleCopy}
      className={`group relative inline-flex items-center cursor-pointer ${className || ''}`}
      title="Click to copy"
    >
      {children}
      <div className="relative ml-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400 group-hover:text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        {isCopied && (
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {popupText}
          </span>
        )}
      </div>
    </div>
  );
};

export default CopyToClipboard;