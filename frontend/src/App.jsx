import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import AnalyzePage from "./pages/AnalyzePage";
import HistoryPage from "./pages/HistoryPage";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />

        <main className="container">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>

        <footer>
          AI Code Review Assistant • Built with React, Node.js & Gemini
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
