"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, Input, Select, Textarea, useToast } from "@/components/ui";
import { adminUpdatePin } from "@/server/actions/admin";
import type { AdminPinDetail as AdminPinDetailData } from "@/server/services";
import type { Category } from "@/types/domain";
import { AdminRemoveAction } from "./AdminRemoveAction";

/**
 * Props for the {@link AdminPinDetail} component.
 */
export type AdminPinDetailProps = {
  pin: AdminPinDetailData;
  categories: Category[];
};

/**
 * A single labelled metric in the pin meta card.
 *
 * @param props - The metric label and value.
 * @param props.label - The metric name.
 * @param props.value - The metric value.
 * @returns The metric element.
 */
function Metric({ label, value }: { label: string; value: number }): ReactElement {
  return (
    <div>
      <dt className="text-xs font-medium text-ink-soft">{label}</dt>
      <dd className="text-lg font-bold text-ink">{value.toLocaleString()}</dd>
    </div>
  );
}

/**
 * Admin detail for a single pin: the image and engagement metrics beside an
 * inline editor for the title, description, link and category, with a separated
 * danger zone to remove the pin.
 *
 * @param props - The pin detail and the category options.
 * @returns The pin detail element.
 */
export function AdminPinDetail({ pin, categories }: AdminPinDetailProps): ReactElement {
  const { show } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(pin.title);
  const [description, setDescription] = useState(pin.description ?? "");
  const [link, setLink] = useState(pin.link ?? "");
  const [categoryId, setCategoryId] = useState(pin.categoryId ?? "");
  const [error, setError] = useState<string | null>(null);

  const onSave = (): void => {
    setError(null);
    startTransition(async () => {
      try {
        await adminUpdatePin(pin.id, {
          title,
          description,
          link,
          categoryId: categoryId === "" ? null : categoryId,
        });
        show({ title: "Pin updated" });
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Please try again.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link
        href="/admin/moderation"
        className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        ← Moderation
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <Image
              src={pin.imageUrl}
              alt={pin.title}
              width={pin.width}
              height={pin.height}
              sizes="(max-width: 1024px) 100vw, 340px"
              className="h-auto w-full"
            />
          </div>
          <div className="rounded-2xl border border-line bg-bg p-5">
            <p className="text-sm text-ink-soft">
              By{" "}
              <Link
                href={`/admin/users/${pin.creatorId}`}
                className="font-semibold text-ink hover:underline"
              >
                {pin.creatorName}
              </Link>
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-4">
              <Metric label="Likes" value={pin.counts.likes} />
              <Metric label="Comments" value={pin.counts.comments} />
              <Metric label="Downloads" value={pin.counts.downloads} />
              <Metric label="Saves" value={pin.counts.saves} />
              <Metric label="Reports" value={pin.counts.reports} />
            </dl>
          </div>
        </div>

        <section className="rounded-2xl border border-line bg-bg p-6">
          <h1 className="text-xl font-extrabold text-ink">Edit pin</h1>
          <div className="mt-4 flex flex-col gap-4">
            <Input
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={1000}
            />
            <Input
              label="Link"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://…"
            />
            <Select
              label="Category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Uncategorised</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </Select>
            {error !== null ? (
              <p role="alert" className="text-sm text-accent">
                {error}
              </p>
            ) : null}
            <Button onClick={onSave} loading={pending}>
              Save
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="text-sm font-semibold text-ink">Remove this pin</p>
              <p className="text-sm text-ink-soft">Deletes the pin and all of its engagement.</p>
            </div>
            <AdminRemoveAction
              kind="pin"
              id={pin.id}
              description={`"${pin.title}" and its likes, comments and saves will be permanently removed.`}
              redirectAfter="/admin/moderation"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
