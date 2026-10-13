import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile } from "@/types";

type ActiveTab = "analyzer" | "roadmap" | "tracker" | "coach" | "certificate";

interface ProfileState extends UserProfile {
  activeTab: ActiveTab;
  setProfile: (profile: UserProfile) => void;
  setActiveTab: (tab: ActiveTab) => void;
  clearProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  targetRole: "",
  experienceYears: 0,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...DEFAULT_PROFILE,
      activeTab: "analyzer",
      setProfile: (profile) => set({ ...profile }),
      setActiveTab: (activeTab) => set({ activeTab }),
      clearProfile: () => set({ ...DEFAULT_PROFILE, activeTab: "analyzer" }),
    }),
    {
      name: "crid-profile",
      partialize: (state) => ({
        targetRole: state.targetRole,
        experienceYears: state.experienceYears,
        currentTitle: state.currentTitle,
        careerBreakMonths: state.careerBreakMonths,
        linkedinUrl: state.linkedinUrl,
      }),
    }
  )
);
