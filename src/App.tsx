import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReaderProvider } from './contexts/ReaderContext';
import { LibraryPage } from './pages/Library';
import { ReaderPage } from './pages/Reader';
import './App.css';

function App() {
  return (
    <ReaderProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/read/:workspaceId" element={<ReaderPage />} />
        </Routes>
      </BrowserRouter>
    </ReaderProvider>
  );
}

export default App;
