import React, { useState, useEffect } from 'react';

interface AboutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutOverlay: React.FC<AboutOverlayProps> = ({ isOpen, onClose }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<string[]>(['Kairo v1.3 – Organized Notes Update (Coming Soon)']);

  useEffect(() => {
    if (isOpen) {
      setIsAnimatingOut(false);
      // Ensure the latest log is always expanded when opening
      if (!expandedLogs.includes('Kairo v1.3 – Organized Notes Update (Coming Soon)')) {
        setExpandedLogs(['Kairo v1.3 – Organized Notes Update (Coming Soon)']);
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  const toggleLog = (logTitle: string) => {
    setExpandedLogs(prev =>
      prev.includes(logTitle)
        ? prev.filter(title => title !== logTitle)
        : [...prev, logTitle]
    );
  };

  if (!isOpen) {
    return null;
  }
  
  const animationClass = isAnimatingOut ? 'animate-slide-out' : 'animate-slide-in';

  const devLogs = [
    {
      title: 'Kairo v1.3 – Organized Notes Update (Coming Soon)',
      description: 'Get ready for a more powerful and flexible note-taking experience.',
      items: [
        { title: 'UI Improvements', points: ['Clearer UI, more compact textboxes'] },
        { title: 'Bug Fixes', points: ['Various bug fixes will be addressed.'] },
        { title: 'New Features', points: [
            'Add image, hyperlink, video, drawing, and voice notes.',
            'Customize entire note display (e.g., background colors).'
          ]
        }
      ]
    },
    {
      title: 'Kairo v1.2 – Synced Tasks Update',
      description: 'Managing your tasks is about to get a lot more efficient with powerful new sorting and viewing options.',
      items: [
        { title: 'UI Improvements', points: ['Clearer UI, more compact textboxes'] },
        { title: 'Bug Fixes', points: ['Various bug fixes will be addressed.'] },
        { title: 'New Features', points: [
            'Sorting system (by calendar, default grouping, due, name, urgency, last modified, date created).',
            'Separate views for pending vs completed tasks.',
            'Button to clear finished tasks.'
          ]
        }
      ]
    },
     {
      title: 'Kairo v1.1 – Multi Calendar Update',
      description: 'This update introduces more control and organization for your calendars.',
      items: [
        { title: 'UI Improvements', points: ['Clearer UI, more compact textboxes'] },
        { title: 'Bug Fixes', points: ['Various bug fixes will be addressed.'] },
        { title: 'New Features', points: [
            'Rearrange calendars in overview.',
            'Add categories to calendars.',
            'Choose which calendars are displayed in overview.'
          ]
        }
      ]
    },
    {
      title: 'Kairo v1.0 – The Foundations',
      description: 'This update lays down the basic foundations of the app, bringing in the essential systems that will grow over time. Here’s what’s new:',
      items: [
        {
          title: 'Multi Calendar',
          points: [
            'Introduced a Multi Calendar system.',
            'Events now include: name, description, start/end time, date, repetition, and color.',
            'Ability to edit and delete events.',
            'Overview calendar: view all events across calendars.',
            'Dropdown menu: filter by individual calendars.',
            'Event box: display all events for a specific date or for the entire month.',
          ],
        },
        {
          title: 'Synced Tasks',
          points: [
            'Add tasks with name, description, due date, urgency, and optional link to a calendar event.',
            'Edit and delete tasks.',
            'Tasks can be grouped automatically based on related events in the calendar.',
          ],
        },
        {
          title: 'Organized Notes',
          points: [
            'Add notes with title, content, and a rich edit bar (bold, italic, underline, text size, numbering, bullet points, and text color).',
            'Notes can be organized into folders linked to calendars.',
            'Tags system: add/manage tags and sort notes by folder and or tag.',
          ],
        },
        {
          title: 'Other',
          points: [
            'Language support for Bahasa Indonesia, English, and Klingon (partially implemented).',
            'Themes dark, light, and cute (partially implemented).',
            'Data Menu includes: export data, import data, and cloud sync (placeholders for now).',
            'Added About section containing app info and devlog.',
          ],
        },
      ],
    },
  ];

  return (
    <div className={`fixed inset-0 bg-slate-950 z-50 ${animationClass}`}>
      <div className="p-6 text-slate-300 leading-relaxed overflow-y-auto h-full">
        <h1 className="text-3xl font-bold text-fuchsia-400 mb-4 font-serif">About Kairo</h1>
        <p className="mb-4">
          Kairo is an all-in-one management app designed to help you live better. It brings together everything you need in one place: Multi Calendar, Synced Tasks, and Organized Notes.
        </p>
        <p className="mb-4">
          The name Kairo comes from the ancient Greek word “Kairos”, which means the right moment. Every moment becomes the right one, because you’vemanaged it well with Kairo.
        </p>
        <p className="mb-6">
          If you find any bugs, errors, or have suggestions for improvements, please contact me on Instagram: <a href="https://www.instagram.com/reallyratt" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:underline">@reallyratt</a>.
        </p>
        <p className="mb-8">Thank you!</p>

        <h2 className="text-3xl font-bold text-fuchsia-400 mb-4 font-serif">Dev Log</h2>
        
        <div className="space-y-2">
            {devLogs.map(log => {
                const isExpanded = expandedLogs.includes(log.title);
                const logId = log.title.replace(/\s+/g, '-');
                return (
                    <div key={log.title} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                            onClick={() => toggleLog(log.title)}
                            className="w-full text-left flex justify-between items-center py-3"
                            aria-expanded={isExpanded}
                            aria-controls={`log-content-${logId}`}
                        >
                            <h3 className="text-xl font-semibold text-slate-100">{log.title}</h3>
                            <i className={`fa-solid fa-chevron-down transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} style={{ color: 'var(--text-secondary)' }}></i>
                        </button>
                        <div
                            id={`log-content-${logId}`}
                            className="transition-all duration-500 ease-in-out overflow-hidden"
                            style={{ maxHeight: isExpanded ? '3000px' : '0px' }}
                        >
                            <div className="pt-2 pb-4">
                                <p className="mb-4 text-slate-400">{log.description}</p>
                                <ul className="list-disc list-inside space-y-4 text-slate-300">
                                    {log.items.map(item => (
                                        <li key={item.title}>
                                            <strong>{item.title}</strong>
                                            <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-slate-400">
                                                {item.points.map(point => <li key={point}>{point}</li>)}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>


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