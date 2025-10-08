import { Route, Routes } from "react-router-dom";
import { ErrorBoundary, ToastProvider } from "@/components";
import DefaultLayout from "@/layouts/default";
import IndexPage from "@/pages/index";

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
