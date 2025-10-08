import { Route, Routes } from "react-router-dom";
import { ErrorBoundary, ToastProvider } from "@/components";
import IndexPage from "@/pages/index";
import DefaultLayout from "@/layouts/default";

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider placement="bottom-right" maxVisibleToasts={3} />
      <DefaultLayout>
        <Routes>
          <Route element={<IndexPage />} path="/" />
        </Routes>
      </DefaultLayout>
    </ErrorBoundary>
  );
}

export default App;
