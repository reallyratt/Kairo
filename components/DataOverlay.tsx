import React, { useState, useEffect, useRef } from 'react';

interface DataOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataOverlay: React.FC<DataOverlayProps> = ({ isOpen, onClose }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimatingOut(false);
      setImportStatus('idle');
      setImportMessage('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  const handleExport = () => {
    try {
      const data: { [key: string]: any } = {};
      const keys = [
        'kairo-calendars', 'kairo-events', 'kairo-tasks', 'kairo-notes', 'kairo-tags', 
        'kairo-folders', 'kairo-language', 'kairo-theme', 'kairo-calendarCategories', 
        'kairo-calendarOrder', 'kairo-calendarCategoryOrder', 'kairo-hiddenInOverview'
      ];
      
      keys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          // Store with the original key for easy import
          data[key] = JSON.parse(item);
        }
      });

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kairo_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
      setImportStatus('error');
      setImportMessage("An error occurred while exporting your data.");
    }
  };
  
  const handleImportClick = () => {
    setImportStatus('idle');
    setImportMessage('');
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File could not be read");
        const data = JSON.parse(text);

        // Basic validation
        const requiredKeys = ['kairo-calendars', 'kairo-events', 'kairo-tasks'];
        const hasRequiredKeys = requiredKeys.every(key => key in data);
        if (!hasRequiredKeys) {
            setImportStatus('error');
            setImportMessage("Invalid backup file. Make sure it's a valid Kairo export.");
            return;
        }

        if (window.confirm("Are you sure you want to import this data? This will overwrite all your current data and cannot be undone.")) {
            // Clear existing kairo data to prevent merge issues
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('kairo-')) {
                    localStorage.removeItem(key);
                }
            });

            // Import new data
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, JSON.stringify(data[key]));
            });
            
            setImportStatus('success');
            setImportMessage("Data imported successfully! The app will reload shortly.");
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
      } catch (error) {
        console.error("Failed to import data:", error);
        setImportStatus('error');
        setImportMessage("Import failed. Please ensure it is a valid JSON backup file.");
      } finally {
        // Reset file input value to allow re-uploading the same file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) {
    return null;
  }
  
  const animationClass = isAnimatingOut ? 'animate-slide-out' : 'animate-slide-in';

  return (
    <div className={`fixed inset-0 bg-slate-950 z-50 ${animationClass}`}>
      <div className="p-6 text-slate-300 leading-relaxed overflow-y-auto h-full">
        <h1 className="text-3xl font-bold text-fuchsia-400 mb-6 font-serif">Data Management</h1>
        
        <div className="space-y-6">
            {/* Export Data */}
            <div className="bg-slate-900 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-slate-100 mb-2">Export Data</h2>
                <p className="text-sm text-slate-400 mb-4">Save a backup of all your data to a JSON file on your device. Keep it safe!</p>
                <button onClick={handleExport} className="w-full btn btn-secondary" disabled={importStatus !== 'idle'}>
                    <i className="fa-solid fa-download mr-2"></i>
                    Export to File
                </button>
            </div>
            
            {/* Import Data */}
            <div className="bg-slate-900 p-4 rounded-lg">
                <h2 className="text-lg font-semibold text-slate-100 mb-2">Import Data</h2>
                <p className="text-sm text-slate-400 mb-4"><span className="font-bold text-red-400">Warning:</span> Importing a file will overwrite all your current data. This action cannot be undone.</p>
                <button onClick={handleImportClick} className="w-full btn btn-danger" disabled={importStatus !== 'idle'}>
                    <i className="fa-solid fa-upload mr-2"></i>
                    Import from File
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".json" />
                {importStatus !== 'idle' && (
                    <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium transition-all duration-300 ${importStatus === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {importMessage}
                    </div>
                )}
            </div>

            {/* Sync to Cloud */}
            <div className="bg-slate-900 p-4 rounded-lg opacity-60">
                <h2 className="text-lg font-semibold text-slate-100 mb-2">Sync to Cloud</h2>
                <p className="text-sm text-slate-400 mb-4">Automatically back up and sync your data across devices. (This feature is coming soon!)</p>
                <button disabled className="w-full btn btn-secondary cursor-not-allowed">
                    <i className="fa-solid fa-cloud mr-2"></i>
                    Coming Soon
                </button>
            </div>
        </div>

        <div className="mt-12 text-center pb-8">
          <button onClick={handleClose} className="btn btn-primary px-8 py-3 text-lg" disabled={importStatus !== 'idle'}>
            <i className="fa-solid fa-arrow-left mr-2"></i>
            Back to the App
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slide-in-from-right {
            0% { transform: translateX(100%); }
            100% { transform: translateX(0); }
        }
        @keyframes slide-out-to-right {
            0% { transform: translateX(0); }
            100% { transform: translateX(100%); }
        }
        .animate-slide-in {
            animation: slide-in-from-right 0.3s ease-out forwards;
        }
        .animate-slide-out {
            animation: slide-out-to-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default DataOverlay;