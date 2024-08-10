import React, { useState, useEffect, useRef } from 'react';

interface RenameSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
}

const RenameSheetModal: React.FC<RenameSheetModalProps> = ({ isOpen, onClose, onRename }) => {
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewName('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  const handleRename = () => {
    if (newName.trim()) {
      onRename(newName);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRename();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Rename Sheet</h2>
        <input
          ref={inputRef}
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border p-2 mb-4 w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          placeholder="Enter new sheet name"
        />
        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded">Cancel</button>
          <button 
            onClick={handleRename}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameSheetModal;
