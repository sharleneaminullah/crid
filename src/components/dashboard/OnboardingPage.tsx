import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Clock, Linkedin, Trophy } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfileStore } from "@/store/profileStore";

const onboardingSchema = z.object({
  targetRole: z
    .string()
    .min(2, "Enter a specific role (e.g. Frontend Lead, Staff Engineer)")
    .max(80),
  experienceYears: z.coerce
    .number()
    .min(0, "Must be 0 or more")
    .max(50, "Must be 50 or less"),
  currentTitle: z.string().max(80).optional(),
  careerBreakMonths: z.coerce.number().min(0).max(240).optional(),
  linkedinUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

const EXAMPLE_ROLES = [
  "Frontend Lead",
  "Staff Software Engineer",
  "Engineering Manager",
  "Product Manager",
  "UX Designer",
  "Data Engineer",
];

export function OnboardingPage() {
  const setProfile = useProfileStore((s) => s.setProfile);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      experienceYears: 5,
      careerBreakMonths: 12,
    },
  });

  const onSubmit = (values: OnboardingValues) => {
    setProfile({
      targetRole: values.targetRole,
      experienceYears: values.experienceYears,
      currentTitle: values.currentTitle,
      careerBreakMonths: values.careerBreakMonths,
      linkedinUrl: values.linkedinUrl,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900/80 to-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-white mb-4">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="hsl(237 84% 67%)" />
              <path
                d="M8 24L16 8L24 24"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M10.5 19H21.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-3xl font-bold tracking-tight">CRID</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Set your target role</h1>
          <p className="text-white/60 text-sm">
            We'll build a personalised readiness roadmap for your return to work.
          </p>
        </div>

        <Card className="border-white/10 bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Tell us about your career goals</CardTitle>
            <CardDescription>
              All fields except Target Role are optional, but more detail = better AI analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Target Role */}
              <div className="space-y-1.5">
                <Label htmlFor="targetRole" className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-primary" />
                  Target role <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="targetRole"
                  placeholder="e.g. Frontend Lead, Staff Engineer…"
                  {...register("targetRole")}
                />
                {errors.targetRole && (
                  <p className="text-xs text-destructive">{errors.targetRole.message}</p>
                )}
                {/* Quick-fill chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {EXAMPLE_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setValue("targetRole", role)}
                      className="text-xs px-2 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience years */}
              <div className="space-y-1.5">
                <Label htmlFor="experienceYears" className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  Years of relevant experience <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min={0}
                  max={50}
                  {...register("experienceYears")}
                />
                {errors.experienceYears && (
                  <p className="text-xs text-destructive">{errors.experienceYears.message}</p>
                )}
              </div>

              {/* Two-col: current title + break months */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="currentTitle" className="text-xs">
                    Last job title
                  </Label>
                  <Input
                    id="currentTitle"
                    placeholder="e.g. Senior Dev"
                    {...register("currentTitle")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="careerBreakMonths" className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    Break length (months)
                  </Label>
                  <Input
                    id="careerBreakMonths"
                    type="number"
                    min={0}
                    max={240}
                    placeholder="12"
                    {...register("careerBreakMonths")}
                  />
                </div>
              </div>

              {/* LinkedIn */}
              <div className="space-y-1.5">
                <Label htmlFor="linkedinUrl" className="flex items-center gap-1.5 text-xs">
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn URL (optional)
                </Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/yourname"
                  {...register("linkedinUrl")}
                />
                {errors.linkedinUrl && (
                  <p className="text-xs text-destructive">{errors.linkedinUrl.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                Build my roadmap
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
