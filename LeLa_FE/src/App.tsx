import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from "./shared/providers/AuthProvider";
import { ServerHealthProvider } from "./shared/providers/ServerHealthProvider";
import { ServerWakeBanner } from "./shared/components/ui/ServerWakeBanner";
import { AppRoutes } from "./app/routes";
import { App as AntdApp } from 'antd';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 3 * 60 * 1000, // 3 minutes staleTime for smooth client caching
      gcTime: 10 * 1000 * 60,   // 10 minutes cache retention
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ServerHealthProvider>
        <AuthProvider>
          <AntdApp>
            <ServerWakeBanner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AntdApp>
        </AuthProvider>
      </ServerHealthProvider>
    </QueryClientProvider>
  );
}

export default App;

