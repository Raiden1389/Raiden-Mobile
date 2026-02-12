import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReaderProvider } from './contexts/ReaderContext';
import { ToastProvider } from './contexts/ToastContext';
import { LibraryPage } from './pages/Library';
import { ReaderPage } from './pages/Reader';
import { CorrectionsPage } from './pages/Corrections';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InstallPrompt } from './components/InstallPrompt';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <ReaderProvider>
        <ToastProvider>
          <BrowserRouter>
            <OfflineIndicator />
            <Routes>
              <Route path="/" element={<LibraryPage />} />
              <Route path="/read/:workspaceId" element={<ReaderPage />} />
              <Route path="/corrections" element={<CorrectionsPage />} />
            </Routes>
            <InstallPrompt />
          </BrowserRouter>
        </ToastProvider>
      </ReaderProvider>
    </ErrorBoundary>
  );
}

export default App;
