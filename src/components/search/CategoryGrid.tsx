import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import type { Category } from "@/types/domain";

/**
 * Props for the {@link CategoryGrid} component.
 */
export type CategoryGridProps = {
  categories: Category[];
};

/**
 * Grid of category cards (background image, dark left gradient, bottom-left
 * label). Clicking a card searches for that category label.
 *
 * @param props - The categories to display.
 * @returns The category grid element.
 */
export function CategoryGrid({ categories }: CategoryGridProps): ReactElement {
  return (
    <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/search?q=${encodeURIComponent(category.label)}`}
          className="group relative block h-[150px] overflow-hidden rounded-[18px]"
        >
          <Image
            src={category.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 to-transparent" />
          <span className="absolute bottom-3 left-3 text-[21px] font-bold text-bg">
            {category.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
