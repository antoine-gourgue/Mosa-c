"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, ConfirmDialog, useToast } from "@/components/ui";
import { createCategory, deleteCategory, updateCategory } from "@/server/actions/admin";
import type { AdminCategoryRow } from "@/server/services";
import { CategoryFormDialog } from "./CategoryFormDialog";
import { DataTable } from "./DataTable";
import type { Column } from "./DataTable";

/**
 * Props for the {@link CategoriesAdmin} component.
 */
export type CategoriesAdminProps = {
  categories: AdminCategoryRow[];
};

type DialogState = { mode: "create" } | { mode: "edit"; category: AdminCategoryRow } | null;

/**
 * Admin category management: a table of categories with their cover, slug and
 * pin count, plus create, edit and delete via a form dialog and a confirmation.
 *
 * @param props - The categories to manage.
 * @returns The categories management element.
 */
export function CategoriesAdmin({ categories }: CategoriesAdminProps): ReactElement {
  const { show } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminCategoryRow | null>(null);

  const onSubmit = (label: string, imageUrl: string): void => {
    setError(null);
    startTransition(async () => {
      try {
        if (dialog?.mode === "edit") {
          await updateCategory(dialog.category.id, label, imageUrl);
          show({ title: "Category updated" });
        } else {
          await createCategory(label, imageUrl);
          show({ title: "Category created" });
        }
        setDialog(null);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Please try again.");
      }
    });
  };

  const onDelete = (): void => {
    const target = toDelete;
    if (target === null) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteCategory(target.id);
        setToDelete(null);
        show({ title: "Category deleted" });
        router.refresh();
      } catch (caught) {
        setToDelete(null);
        show({
          title: "Could not delete",
          description: caught instanceof Error ? caught.message : "Please try again.",
        });
      }
    });
  };

  const columns: Column<AdminCategoryRow>[] = [
    {
      key: "cover",
      header: "",
      className: "w-14",
      render: (category) => (
        <div className="relative size-10 overflow-hidden rounded-lg bg-surface">
          <Image src={category.imageUrl} alt="" fill sizes="40px" className="object-cover" />
        </div>
      ),
    },
    {
      key: "label",
      header: "Category",
      render: (category) => (
        <div>
          <div className="font-semibold text-ink">{category.label}</div>
          <div className="text-ink-soft">/{category.slug}</div>
        </div>
      ),
    },
    { key: "pins", header: "Pins", render: (category) => category.pinCount },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (category) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="plain"
            size="sm"
            className="text-ink-soft hover:bg-surface hover:text-ink"
            onClick={() => {
              setError(null);
              setDialog({ mode: "edit", category });
            }}
          >
            Edit
          </Button>
          <Button
            variant="plain"
            size="sm"
            className="text-accent hover:bg-accent/10"
            onClick={() => setToDelete(category)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-ink">Categories</h1>
        <Button
          onClick={() => {
            setError(null);
            setDialog({ mode: "create" });
          }}
        >
          Add category
        </Button>
      </div>

      <div className="mt-5">
        <DataTable
          columns={columns}
          rows={categories}
          getRowKey={(category) => category.id}
          empty="No categories yet."
        />
      </div>

      {dialog !== null ? (
        <CategoryFormDialog
          title={dialog.mode === "edit" ? "Edit category" : "New category"}
          submitLabel={dialog.mode === "edit" ? "Save" : "Create"}
          initialLabel={dialog.mode === "edit" ? dialog.category.label : ""}
          initialImageUrl={dialog.mode === "edit" ? dialog.category.imageUrl : ""}
          pending={pending}
          error={error}
          onSubmit={onSubmit}
          onCancel={() => setDialog(null)}
        />
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete !== null ? `Delete "${toDelete.label}"?` : ""}
        description="Pins in this category will become uncategorised. This cannot be undone."
        confirmLabel="Delete"
        destructive
        pending={pending}
        onConfirm={onDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
