# Detail View Pattern Reference

## Three-Layer Architecture

Every entity detail view follows three layers: **Container**, **Detail**, and **Sections**.

```
Container (Sheet / Drawer / Page)
  |
  +-- Detail (layout + section assembly)
       |
       +-- Section A (single concern, read-only)
       +-- Section B
       +-- Section C (CTA / actions)
```

---

## Layer 1: Container

The container manages the shell (Sheet, Drawer, Dialog, or Page), open/close state, and passes the entity ID down.

```typescript
// components/ItemDetailSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ItemDetail } from "./ItemDetail";

interface ItemDetailSheetProps {
  open: boolean;
  onOpenChange: () => void;
  itemId: string;
}

export function ItemDetailSheet({
  open,
  onOpenChange,
  itemId,
}: ItemDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Item Details</SheetTitle>
        </SheetHeader>
        <ItemDetail itemId={itemId} />
      </SheetContent>
    </Sheet>
  );
}
```

---

## Layer 2: Detail

The detail component fetches data (or receives it as props) and composes sections. Layout uses `space-y-0 divide-y` for flat, divider-separated sections.

```typescript
// components/ItemDetail.tsx
import { InfoSection } from "./sections/InfoSection";
import { NotesSection } from "./sections/NotesSection";
import { ActionsSection } from "./sections/ActionsSection";

interface ItemDetailProps {
  itemId: string;
}

export async function ItemDetail({ itemId }: ItemDetailProps) {
  const item = await fetchItem(itemId);

  if (!item) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Item not found
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y">
      <InfoSection item={item} />
      {item.notes && <NotesSection notes={item.notes} />}
      <ActionsSection item={item} />
    </div>
  );
}
```

Key rules:
- Use `space-y-0 divide-y` (not `space-y-4` or `gap-4`)
- Sections return `null` when they have no content
- No rounded corners or cards wrapping sections

---

## Layer 3: Sections

Each section displays one concern. Sections are read-only display components. Actions live in a dedicated CTA section, not inline.

### SectionLayout (shared wrapper)

```typescript
// components/shared/SectionLayout.tsx
interface SectionLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function SectionLayout({ title, children }: SectionLayoutProps) {
  return (
    <div className="py-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
```

### InfoGrid + InfoItem (vertical label-value pairs)

```typescript
// components/shared/InfoGrid.tsx
interface InfoGridProps {
  cols?: 1 | 2 | 3;
  children: React.ReactNode;
}

export function InfoGrid({ cols = 2, children }: InfoGridProps) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
  }[cols];

  return <div className={`grid ${gridClass} gap-4`}>{children}</div>;
}

interface InfoItemProps {
  label: string;
  children: React.ReactNode;
}

export function InfoItem({ label, children }: InfoItemProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}
```

### RowItem (horizontal label-value pairs)

```typescript
// components/shared/RowItem.tsx
interface RowItemProps {
  label: string;
  children: React.ReactNode;
}

export function RowItem({ label, children }: RowItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}
```

---

## Complete Section Examples

### Info Section

```typescript
// components/sections/InfoSection.tsx
import { SectionLayout } from "@/components/shared/SectionLayout";
import { InfoGrid, InfoItem } from "@/components/shared/InfoGrid";
import { Badge } from "@/components/ui/badge";

export function InfoSection({ item }: { item: Item }) {
  return (
    <SectionLayout title="DETAILS">
      <InfoGrid cols={2}>
        <InfoItem label="Name">{item.name}</InfoItem>
        <InfoItem label="Status">
          <Badge variant={item.status === "active" ? "default" : "secondary"}>
            {item.status}
          </Badge>
        </InfoItem>
        <InfoItem label="Email">{item.email || "Not provided"}</InfoItem>
        <InfoItem label="ID">
          <span className="font-mono text-xs">{item.id}</span>
        </InfoItem>
      </InfoGrid>
    </SectionLayout>
  );
}
```

### Notes Section

```typescript
// components/sections/NotesSection.tsx
import { SectionLayout } from "@/components/shared/SectionLayout";

interface NotesSectionProps {
  notes: string | null;
}

export function NotesSection({ notes }: NotesSectionProps) {
  if (!notes) return null;

  return (
    <SectionLayout title="NOTES">
      <p className="text-sm text-foreground whitespace-pre-wrap">{notes}</p>
    </SectionLayout>
  );
}
```

### Actions Section (CTA)

```typescript
// components/sections/ActionsSection.tsx
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { SectionLayout } from "@/components/shared/SectionLayout";

export function ActionsSection({ item }: { item: Item }) {
  const [isPending, startTransition] = useTransition();

  return (
    <SectionLayout title="ACTIONS">
      <div className="flex gap-2">
        <Button
          variant="default"
          className="flex-1"
          disabled={isPending}
          onClick={() => startTransition(() => archiveItem(item.id))}
        >
          {isPending ? "Archiving..." : "Archive"}
        </Button>
        <Button variant="destructive" className="flex-1">
          Delete
        </Button>
      </div>
    </SectionLayout>
  );
}
```

---

## Loading Skeleton

The skeleton must match the final layout to prevent CLS.

```typescript
// components/ItemDetailSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function ItemDetailSkeleton() {
  return (
    <div className="space-y-0 divide-y">
      {/* Info section skeleton */}
      <div className="py-4">
        <Skeleton className="h-3 w-20 mb-3" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>

      {/* Notes section skeleton */}
      <div className="py-4">
        <Skeleton className="h-3 w-16 mb-3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-1" />
      </div>

      {/* Actions section skeleton */}
      <div className="py-4">
        <Skeleton className="h-3 w-20 mb-3" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </div>
  );
}
```

---

## Anti-Patterns

| Anti-Pattern | Correct Alternative |
|-------------|---------------------|
| Rounded corners on sections (`rounded-lg border p-4`) | Flat layout: `space-y-0 divide-y` |
| Inline edit/delete buttons in info sections | Dedicated `ActionsSection` at bottom |
| `space-y-4` between sections | `space-y-0 divide-y` |
| Lowercase section headers (`Contact Info`) | Uppercase: `CONTACT INFO` with `tracking-wide` |
| Monolithic detail component (no sections) | Split into Container -> Detail -> Sections |
| Sections that render blank when empty | Return `null` when no data |
| Custom card wrappers inside sheet | Use `SectionLayout` for consistency |
| Fetching data in section components | Fetch in Detail, pass data to Sections |
