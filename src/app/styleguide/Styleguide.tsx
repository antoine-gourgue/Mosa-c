"use client";

import { useState } from "react";
import type { ReactElement, ReactNode } from "react";
import {
  Avatar,
  Button,
  Divider,
  IconButton,
  Input,
  Pill,
  Sheet,
  Skeleton,
  Spinner,
  Surface,
  Tabs,
  ToastProvider,
  useToast,
} from "@/components/ui";
import { PinCardSkeleton } from "@/components/pin";
import {
  BackIcon,
  BellIcon,
  CameraIcon,
  CheckIcon,
  Logo,
  MoreIcon,
  NotesIcon,
  OrganizeIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  SlidersIcon,
  SparkleIcon,
  StackIcon,
} from "@/icons";

type SectionProps = {
  title: string;
  children: ReactNode;
};

/**
 * Titled block grouping a set of component examples.
 *
 * @param props - The section title and its content.
 * @returns The rendered section.
 */
function Section({ title, children }: SectionProps): ReactElement {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{title}</h2>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </section>
  );
}

/**
 * Button that triggers a demo toast through {@link useToast}.
 *
 * @returns The toast trigger button.
 */
function ToastDemo(): ReactElement {
  const { show } = useToast();
  return (
    <Button
      variant="dark"
      onClick={() =>
        show({
          title: "Saved to Quick Saves",
          description: "Andromeda galaxy",
          action: { label: "View", onClick: () => undefined },
        })
      }
    >
      Show toast
    </Button>
  );
}

/**
 * Button opening the responsive {@link Sheet} primitive so its bottom-sheet
 * (mobile) / dialog (desktop) behaviour can be eyeballed.
 *
 * @returns The sheet trigger and its overlay.
 */
function SheetDemo(): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="dark" onClick={() => setOpen(true)}>
        Open sheet
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add to highlight">
        <p className="text-ink-soft">
          Full-width bottom sheet on mobile, centered dialog on desktop.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button variant="dark">Create new highlight</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </>
  );
}

/**
 * In-page {@link Tabs} example wired to local state.
 *
 * @returns The tab bar demo.
 */
function TabsDemo(): ReactElement {
  const [tab, setTab] = useState("account");
  return (
    <div className="w-full">
      <Tabs
        ariaLabel="Styleguide tabs"
        active={tab}
        onChange={setTab}
        items={[
          { key: "account", label: "Account" },
          { key: "profile", label: "Profile" },
          { key: "privacy", label: "Privacy" },
          { key: "notifications", label: "Notifications" },
          { key: "interests", label: "Interests" },
        ]}
      />
      <p className="mt-3 text-sm text-ink-soft">Active: {tab}</p>
    </div>
  );
}

const ICONS = [
  { label: "Search", node: <SearchIcon /> },
  { label: "Camera", node: <CameraIcon /> },
  { label: "Plus", node: <PlusIcon /> },
  { label: "Bell", node: <BellIcon /> },
  { label: "Stack", node: <StackIcon /> },
  { label: "Share", node: <ShareIcon /> },
  { label: "More", node: <MoreIcon /> },
  { label: "Back", node: <BackIcon /> },
  { label: "Check", node: <CheckIcon /> },
  { label: "Sliders", node: <SlidersIcon /> },
  { label: "Sparkle", node: <SparkleIcon /> },
  { label: "Organize", node: <OrganizeIcon /> },
  { label: "Notes", node: <NotesIcon /> },
];

/**
 * Development-only showcase rendering every design-system component with its
 * variants, sizes and states.
 *
 * @returns The styleguide content.
 */
export function Styleguide(): ReactElement {
  return (
    <ToastProvider>
      <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-pin bg-accent text-bg shadow-pop">
            <Logo size={26} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold text-ink">Mosaic Styleguide</h1>
            <p className="text-ink-soft">Design-system components and tokens.</p>
          </div>
        </header>

        <Section title="Colors">
          {[
            ["bg-accent", "accent"],
            ["bg-ink", "ink"],
            ["bg-ink-soft", "ink-soft"],
            ["bg-surface", "surface"],
            ["bg-surface-2", "surface-2"],
            ["bg-surface-3", "surface-3"],
          ].map(([cls, label]) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <span className={`size-16 rounded-lg ${cls} ring-1 ring-line`} />
              <span className="text-xs text-ink-soft">{label}</span>
            </div>
          ))}
        </Section>

        <Section title="Buttons — variants">
          <Button variant="accent">Save</Button>
          <Button variant="dark">Saved</Button>
          <Button variant="ghost">Visit</Button>
          <Button variant="social" leftIcon={<CheckIcon size={18} />}>
            Continue with Google
          </Button>
        </Section>

        <Section title="Buttons — sizes / states">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button leftIcon={<PlusIcon size={18} />}>With icon</Button>
        </Section>

        <Section title="Icon buttons">
          <IconButton label="More" tone="solid">
            <MoreIcon size={18} />
          </IconButton>
          <IconButton label="Share" tone="solid">
            <ShareIcon size={18} />
          </IconButton>
          <IconButton label="Notifications">
            <BellIcon size={22} />
          </IconButton>
          <IconButton label="Saves" active>
            <StackIcon size={22} />
          </IconButton>
          <IconButton label="Create" tone="dark">
            <PlusIcon />
          </IconButton>
        </Section>

        <Section title="Avatars">
          <Avatar name="Mira Solene" size={32} />
          <Avatar src="/images/creator1.png" name="Studio Atlas" size={44} verified />
          <Avatar name="Bloom Co" size={48} verified />
          <Avatar name="Northlight" size={68} />
        </Section>

        <Section title="Pills">
          <Pill active>Home</Pill>
          <Pill>Saved</Pill>
          <Pill size="sm">Small</Pill>
          <Pill size="lg" active>
            Female
          </Pill>
        </Section>

        <Section title="Inputs">
          <div className="flex w-full max-w-sm flex-col gap-4">
            <Input label="Email" type="email" placeholder="you@example.com" />
            <Input label="Password" type="password" placeholder="Create a password" />
            <Input
              label="Age"
              type="number"
              placeholder="Your age"
              hint="Used to personalize ideas."
            />
            <Input label="Board" defaultValue="Quick Saves" error="This board already exists." />
          </div>
        </Section>

        <Section title="Surfaces & Divider">
          <Surface
            radius="pin"
            elevation="pop"
            className="flex size-32 items-center justify-center"
          >
            <span className="text-ink-soft">pin / pop</span>
          </Surface>
          <Surface radius="2xl" className="flex size-32 items-center justify-center bg-surface">
            <span className="text-ink-soft">2xl</span>
          </Surface>
          <div className="w-48">
            <Divider />
          </div>
        </Section>

        <Section title="Loading">
          <Spinner />
          <Skeleton width={160} height={16} />
          <Skeleton circle width={48} height={48} />
          <div className="w-48">
            <PinCardSkeleton height={180} />
          </div>
        </Section>

        <Section title="Tabs">
          <TabsDemo />
        </Section>

        <Section title="Sheet (responsive)">
          <SheetDemo />
        </Section>

        <Section title="Toast">
          <ToastDemo />
        </Section>

        <Section title="Icons">
          {ICONS.map((icon) => (
            <div key={icon.label} className="flex flex-col items-center gap-2 text-ink">
              {icon.node}
              <span className="text-xs text-ink-soft">{icon.label}</span>
            </div>
          ))}
        </Section>
      </main>
    </ToastProvider>
  );
}
