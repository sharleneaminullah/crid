// Skill & Gap Analysis

export interface SkillNode {
  name: string;
  /** 0-100 user's current level */
  current: number;
  /** 0-100 level required for target role */
  required: number;
  category: SkillCategory;
}

export type SkillCategory =
  | "technical"
  | "leadership"
  | "communication"
  | "tooling"
  | "domain";

export interface SkillGapAnalysis {
  targetRole: string;
  experienceYears: number;
  skills: SkillNode[];
  readinessScore: number;
  generatedAt: string;
}

// Learning Sprint

export type SprintStatus = "todo" | "in_progress" | "done";

export interface SubTask {
  id: string;
  label: string;
  done: boolean;
}

export interface LearningProject {
  id: string;
  title: string;
  description: string;
  estimatedDays: number;
  skills: string[];
  status: SprintStatus;
  subTasks: SubTask[];
  githubSpec?: string;
  order: number;
  createdAt: string;
}

// Progress & Readiness

export interface ReadinessSnapshot {
  id: string;
  score: number;
  date: string;
  completedProjects: number;
  totalSubTasks: number;
  completedSubTasks: number;
}

// Certificate

export interface ReadinessCertificate {
  userId: string;
  userName: string;
  targetRole: string;
  readinessScore: number;
  completedProjects: string[];
  competencySummary: string;
  issuedAt: string;
  verificationCode: string;
}

// Chat

export interface ChatContext {
  targetRole: string;
  experienceYears: number;
  readinessScore: number;
  topSkillGaps: string[];
}

// User Profile

export interface UserProfile {
  targetRole: string;
  experienceYears: number;
  currentTitle?: string;
  careerBreakMonths?: number;
  linkedinUrl?: string;
}

// API Payloads

export interface AnalyzeSkillsRequest {
  targetRole: string;
  experienceYears: number;
  currentTitle?: string;
}

export interface GenerateSprintsRequest {
  targetRole: string;
  skillGaps: SkillNode[];
  existingProjects: string[];
}

export interface GenerateCertificateRequest {
  userName: string;
  targetRole: string;
  readinessScore: number;
  completedProjects: string[];
  skillGaps: SkillNode[];
}
