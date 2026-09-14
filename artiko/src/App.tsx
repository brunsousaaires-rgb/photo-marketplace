import { BrowserRouter, Routes, Route } from "react-router-dom";
import QuizApp from "./pages/QuizApp";
import SalesPage from "./pages/SalesPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QuizApp />} />
        <Route path="/oferta" element={<SalesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
