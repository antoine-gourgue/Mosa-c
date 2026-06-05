"use client";

import type { ReactElement } from "react";
import { Button, Pill } from "@/components/ui";

/**
 * The gender values persisted on the user, matching the Prisma enum.
 */
export type GenderValue = "FEMALE" | "MALE" | "NON_BINARY" | "UNDISCLOSED";

const OPTIONS: { value: GenderValue; label: string }[] = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "UNDISCLOSED", label: "Prefer not to say" },
];

/**
 * Props for the {@link GenderStep} component.
 */
export type GenderStepProps = {
  value: GenderValue | null;
  onChange: (value: GenderValue) => void;
  onNext: () => void;
  pending: boolean;
};

/**
 * Onboarding step collecting the user's gender to personalize ideas. Each
 * option is a full-width pill; Next stays disabled until a choice is made.
 *
 * @param props - The current value and step callbacks.
 * @returns The gender step element.
 */
export function GenderStep({ value, onChange, onNext, pending }: GenderStepProps): ReactElement {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-ink">What&rsquo;s your gender?</h1>
      <p className="mt-2 text-ink-soft">
        This helps us find more relevant ideas. We won&rsquo;t show it on your profile.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {OPTIONS.map((option) => (
          <Pill
            key={option.value}
            size="lg"
            fullWidth
            active={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Pill>
        ))}
      </div>

      <Button
        type="button"
        fullWidth
        className="mt-6"
        disabled={value === null}
        loading={pending}
        onClick={onNext}
      >
        Next
      </Button>
    </div>
  );
}
