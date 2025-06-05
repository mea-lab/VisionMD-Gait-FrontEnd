// src/pages/HomePage/index.jsx
import { useState } from 'react';
import Sidebar from './sidebar';
import Projects from './projects';
import Info from './info';
import Settings from './settings';

export default function HomePage() {
  const [view, setView] = useState('projects');

  return (
    <div className="flex h-screen bg-surface text-gray-100 bg-zinc-800">
      <Sidebar view={view} setView={setView} />
      <main className="flex-1 overflow-y-auto p-6">
        {view === 'projects' && <Projects />}
        {view === 'info' && <Info />}
        {view === 'settings' && <Settings />}
      </main>
    </div>
  );
}
