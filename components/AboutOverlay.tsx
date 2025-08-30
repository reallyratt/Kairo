import React, { useState, useEffect } from 'react';

interface AboutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutOverlay: React.FC<AboutOverlayProps> = ({ isOpen, onClose }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimatingOut(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  if (!isOpen) {
    return null;
  }
  
  const animationClass = isAnimatingOut ? 'animate-slide-out' : 'animate-slide-in';

  return (
    <div className={`fixed inset-0 bg-slate-950 z-50 ${animationClass}`}>
      <div className="p-6 text-slate-300 leading-relaxed overflow-y-auto h-full">
        <h1 className="text-3xl font-bold text-fuchsia-400 mb-4 font-serif">About Kairo</h1>
        <p className="mb-4">
          Kairo is an all-in-one management app designed to help you live better. It brings together everything you need in one place: Multi-Calendar, Harmonized To-Do, Linked Notes, Habit Tracker, and Finance Manager.
        </p>
        <p className="mb-4">
          The name Kairo comes from the ancient Greek word “Kairos”, which means the right moment. Every moment becomes the right one, because you’vemanaged it well with Kairo.
        </p>
        <p className="mb-6">
          If you find any bugs, errors, or have suggestions for improvements, please contact me on Instagram: <a href="https://www.instagram.com/reallyratt" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:underline">@reallyratt</a>.
        </p>
        <p className="mb-8">Thank you!</p>

        <h2 className="text-3xl font-bold text-fuchsia-400 mb-4 font-serif">Dev Log</h2>
        
        <h3 className="text-xl font-semibold text-slate-100 mb-3">Kairo v1.0</h3>
        <ul className="list-disc list-inside space-y-4 text-slate-300">
          <li>
            <strong>Core Experience:</strong>
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-slate-400">
              <li>Responsive, mobile-first design with a clean, modern UI.</li>
              <li>Persistent data storage using the browser's local storage.</li>
              <li>Multi-Language Support (English, Bahasa Indonesia, and Klingon).</li>
              <li>Personalizable Themes: Choose from Dark, Light, or Cute themes.</li>
              <li>Data Management: Securely export and import all your data via JSON files.</li>
              <li>Intuitive bottom navigation for quick access to all features.</li>
            </ul>
          </li>
          <li>
            <strong>Calendar:</strong>
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-slate-400">
              <li>Multi-Calendar Management: Create, update, and delete calendars with custom colors.</li>
              <li>Central "Overview" calendar to see all events in one place.</li>
              <li>Interactive monthly grid view with event indicators.</li>
              <li>Recurring Events: Schedule events to repeat daily, weekly, monthly, or yearly.</li>
              <li>Flexible Event Management: Create, edit, and delete events with details like name, description, time, and color.</li>
              <li>Detailed Event List: View a sorted list of events for the selected day or month.</li>
            </ul>
          </li>
          <li>
            <strong>To-Do List:</strong>
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-slate-400">
              <li>Harmonized Task View: Filter your to-do list by calendar.</li>
              <li>Event-Linked Tasks: Associate tasks with specific calendar events for better organization.</li>
              <li>Smart Grouping: Tasks are automatically grouped by event or as "General Tasks".</li>
              <li>Detailed Tasks: Add a name, description, due date, urgency level (Low, Medium, High), and a custom color.</li>
              <li>Efficient Sorting: Completed tasks and fully completed groups automatically move to the bottom.</li>
            </ul>
          </li>
           <li>
            <strong>Notes:</strong>
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-slate-400">
                <li>Rich Text Editor: Format notes with bold, italics, underline, lists, links, colors, and font sizes.</li>
                <li>Folder Organization: Group notes into folders, which are seamlessly integrated with your calendars.</li>
                <li>Powerful Tagging System: Create custom tags, add multiple tags to notes, and filter your note list by one or more tags.</li>
                <li>Unsaved Changes Warning: Never lose your work accidentally.</li>
            </ul>
          </li>
          <li>
            <strong>Habit Tracker:</strong>
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-slate-400">
              <li>Customizable Habits: Create, edit, and delete habits with custom names, descriptions, and colors.</li>
              <li>Category Management: Organize habits into personalized categories.</li>
              <li>Flexible Tracking: Supports both "Yes/No" (checkbox) and "Number" (unit-based) habits.</li>
              <li>Weekly View: Easily log your progress for the current week.</li>
              <li>Monthly Archive: Dive deep into any habit with a full calendar view of your historical performance.</li>
            </ul>
          </li>
          <li>
            <strong>Finance Manager:</strong>
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-slate-400">
              <li>Multi-Wallet Support: Manage multiple accounts (e.g., cash, bank) with custom icons and colors.</li>
              <li>Central "Overview" wallet to see all transactions combined.</li>
              <li>Dynamic Categories: Create income and expense categories on the fly while adding transactions.</li>
              <li>Comprehensive Summary: Instantly see your income, expenses, and current balance for any period.</li>
              <li>Advanced Filtering: Filter transaction history by wallet, time period (day, week, month, year, custom range), and by category.</li>
              <li>Organized Category Selection: Filter and selection dropdowns group categories by "Income" and "Expenses".</li>
            </ul>
          </li>
        </ul>

        <div className="mt-12 text-center pb-8">
          <button onClick={handleClose} className="btn btn-primary px-8 py-3 text-lg">
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

export default AboutOverlay;
