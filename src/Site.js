import React, { useState, useEffect } from 'react';
import App from './components/App';
import Landing from './components/Landing';

export default function Site() {
  const [page, setPage] = useState('landing');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)'); // Mobile size threshold
    const handleResize = (e) => setIsMobile(e.matches);

    // Check on mount
    setIsMobile(mediaQuery.matches);

    // Add listener for window resizing
    mediaQuery.addEventListener('change', handleResize);

    // Clean up listener on unmount
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div id='sorry'>
        <h1>Paperbase.</h1>
        <p>Please visit us on your desktop computer to access our site. Mobile version launching December 2024.</p>
      </div>

    )
  }

  return (
    <div>
      {page === 'landing' && <Landing setPage={setPage} />}
      {page === 'app' && <App setPage={setPage} />}
    </div>
  );
}