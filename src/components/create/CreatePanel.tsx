"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { useNavPanel } from "@/components/layout/NavPanelProvider";
import { CameraIcon, ImageIcon, SparkleIcon } from "@/icons";
import { cn } from "@/lib/cn";

/**
 * One create option in the panel: an icon tile, a title and a hint.
 *
 * @param props - The option's icon, labels and click handler.
 * @returns The option button.
 */
function Option({
  icon,
  title,
  hint,
  accent,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  accent?: boolean;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-surface"
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl",
          accent === true ? "bg-accent/10 text-accent" : "bg-surface text-ink",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-sm text-ink-soft">{hint}</span>
      </span>
    </button>
  );
}

/**
 * The desktop "Create" rail panel: slides in to the right of the {@link SideNav}
 * with ways to make a pin — upload your own image, and (when AI image generation
 * is configured) generate one with AI. Picking an option navigates and closes
 * the panel. Hidden below the `sm` breakpoint, where the bottom navigation links
 * straight to `/create`.
 *
 * @param props - Whether the AI generation entry should be offered.
 * @returns The create panel element.
 */
export function CreatePanel({
  imageGenEnabled = false,
}: {
  imageGenEnabled?: boolean;
}): ReactElement {
  const t = useTranslations("create");
  const router = useRouter();
  const { activePanel, close } = useNavPanel();
  const open = activePanel === "create";

  const go = (href: string): void => {
    router.push(href);
    close();
  };

  return (
    <aside
      aria-label={t("aiPanelHeading")}
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "fixed bottom-0 left-16 top-0 z-40 hidden w-[360px] flex-col border-r border-line bg-bg transition-transform duration-200 ease-out sm:flex",
        open ? "translate-x-0" : "pointer-events-none -translate-x-[calc(100%+0.5rem)]",
      )}
    >
      <header className="px-4 pb-2 pt-3">
        <h2 className="text-xl font-bold text-ink">{t("aiPanelHeading")}</h2>
      </header>
      <div className="flex flex-col gap-1 px-2">
        <Option
          icon={<ImageIcon size={22} />}
          title={t("uploadAPin")}
          hint={t("uploadAPinHint")}
          onClick={() => go("/create")}
        />
        <Option
          icon={<CameraIcon size={22} />}
          title={t("createStory")}
          hint={t("createStoryHint")}
          onClick={() => go("/stories/create")}
        />
        {imageGenEnabled ? (
          <Option
            icon={<SparkleIcon size={22} />}
            title={t("generateWithAi")}
            hint={t("generateWithAiHint")}
            accent
            onClick={() => go("/create?mode=ai")}
          />
        ) : null}
      </div>
    </aside>
  );
}
