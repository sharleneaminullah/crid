import { ClerkProvider } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

if (!clerkPubKey) {
  console.warn(
    "⚠️  VITE_CLERK_PUBLISHABLE_KEY not set. Auth features will be disabled.\n" +
      "Copy .env.example to .env.local and add your Clerk key."
  );
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey ?? "pk_test_placeholder"}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ClerkProvider>
  </StrictMode>
);
