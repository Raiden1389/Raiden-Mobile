import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReaderProvider } from './contexts/ReaderContext';
import { LibraryPage } from './pages/Library';
import { ReaderPage } from './pages/Reader';
import { CorrectionsPage } from './pages/Corrections';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InstallPrompt } from './components/InstallPrompt';
import './App.css';

function App() {
  return (
    <ReaderProvider>
      <BrowserRouter>
        <OfflineIndicator />
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/read/:workspaceId" element={<ReaderPage />} />
          <Route path="/corrections" element={<CorrectionsPage />} />
        </Routes>
        <InstallPrompt />
      </BrowserRouter>
    </ReaderProvider>
  );
}

export default App;
