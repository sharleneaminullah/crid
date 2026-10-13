import { RedirectToSignIn, useAuth, useUser } from "@clerk/react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OnboardingPage } from "@/components/dashboard/OnboardingPage";
import { useProfileStore } from "@/store/profileStore";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Loading CRID…</p>
      </div>
    </div>
  );
}

function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded } = useUser();
  const targetRole = useProfileStore((s) => s.targetRole);

  if (!isLoaded || !userLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <RedirectToSignIn />;
  return targetRole ? <DashboardLayout /> : <OnboardingPage />;
}

export default function App() {
  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen"
        >
          <AuthGate />
        </motion.div>
      </AnimatePresence>
      <Toaster />
    </>
  );
}
