import React, { useState } from 'react';
import App from './App';
import Landing from './Landing';

export default function Site() {

  const [page, setPage] = useState('landing');

  return (
    <div>
      {page === 'landing' && <Landing setPage={setPage}/>}
      {page === 'app' && <App />}
    </div>
  )
}
