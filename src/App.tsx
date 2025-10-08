import { Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components";
import IndexPage from "@/pages/index";

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<IndexPage />} path="/" />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
