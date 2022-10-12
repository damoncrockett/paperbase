import React, { useState } from 'react';
import App from './App';
import Landing from './Landing';

export default function Site() {

  const [page, setPage] = useState('app');

  return (
    <div>
      {page === 'landing' && <Landing setPage={setPage}/>}
      {page === 'app' && <App />}
    </div>
  )
}
