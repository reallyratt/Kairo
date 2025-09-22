import React from 'react';
import { Link } from 'react-router-dom';

function AboutPage() {
  return (
    <div className="p-6 text-slate-300 leading-relaxed">
      <h1 className="text-3xl font-bold text-fuchsia-400 mb-4 font-serif">About Kairo</h1>
      <p className="mb-4">
        Kairo is an all-in-one management app designed to help you live better. It brings together everything you need in one place: Multi-Calendar, Harmonized To-Do, and Linked Notes.
      </p>
      <p className="mb-4">
        The name Kairo comes from the ancient Greek word “Kairos”, which means the right moment. Every moment becomes the right one, because you’ve managed it well with Kairo.
      </p>
      <p className="mb-6">
        If you find any bugs, errors, or have suggestions for improvements, please contact me on Instagram: <a href="https://www.instagram.com/reallyratt" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:underline">@reallyratt</a>.
      </p>
      <p className="mb-8">Thank you!</p>

      <h2 className="text-3xl font-bold text-fuchsia-400 mb-4 font-serif">Dev Log</h2>
      <h3 className="text-xl font-semibold text-slate-100 mb-3">Kairo v0.2</h3>
      <ul className="list-disc list-inside space-y-2 text-slate-300">
        <li>
          <strong>Multi-Calendar Management:</strong>
          <ul className="list-disc list-inside ml-6 mt-1 text-slate-400">
            <li>Create, rename, and delete calendars with custom colors.</li>
            <li>View all events in an "Overview" calendar.</li>
            <li>Interactive monthly calendar view with event indicators.</li>
            <li>Add events with details like time, date, description, and color.</li>
            <li>View a sorted list of events for the selected day or month.</li>
          </ul>
        </li>
        <li>
          <strong>Harmonized To-Do List:</strong>
          <ul className="list-disc list-inside ml-6 mt-1 text-slate-400">
            <li>Tasks are automatically grouped by their parent calendar.</li>
            <li>Toggle tasks between complete and incomplete states.</li>
          </ul>
        </li>
         <li>
          <strong>Core Experience:</strong>
          <ul className="list-disc list-inside ml-6 mt-1 text-slate-400">
            <li>A clean, modern, dark-themed UI designed for mobile.</li>
            <li>Intuitive bottom navigation for quick access to all features.</li>
            <li>Persistent data storage using the browser's local storage.</li>
          </ul>
        </li>
      </ul>

      <div className="mt-12 text-center">
        <Link to="/calendar" className="btn btn-primary px-8 py-3 text-lg">
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Back to the App
        </Link>
      </div>
    </div>
  );
}

export default AboutPage;