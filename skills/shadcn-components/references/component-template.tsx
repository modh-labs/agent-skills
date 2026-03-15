// Reference: Generic shadcn component template with Sheet detail pattern
// Usage: Copy and adapt for new entity card + detail views

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Item {
  id: string;
  title: string;
  description: string;
  status: "active" | "archived";
}

interface ItemCardProps {
  item: Item;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

// ---------------------------------------------------------------------------
// Card Component (row in a list)
// ---------------------------------------------------------------------------

/**
 * Displays an item card with expandable detail sheet.
 *
 * Uses single toggle handler for open/close.
 * Only CSS variable tokens -- no hardcoded colors.
 * Only shadcn components -- no raw HTML elements.
 */
export function ItemCard({
  item,
  isExpanded,
  onToggleExpand,
}: ItemCardProps) {
  return (
    <>
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggleExpand}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">{item.title}</CardTitle>
            <Badge
              variant={item.status === "active" ? "default" : "secondary"}
            >
              {item.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{item.description}</p>
        </CardContent>
      </Card>

      <Sheet open={isExpanded} onOpenChange={onToggleExpand}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{item.title}</SheetTitle>
          </SheetHeader>

          {/* Detail content -- use three-layer pattern for real views */}
          <div className="space-y-0 divide-y mt-6">
            {/* Section: Info */}
            <div className="py-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                DETAILS
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      item.status === "active" ? "default" : "secondary"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ID</p>
                  <span className="font-mono text-xs">{item.id}</span>
                </div>
              </div>
            </div>

            {/* Section: Description */}
            <div className="py-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                DESCRIPTION
              </h3>
              <p className="text-sm text-foreground">{item.description}</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// List Component (parent manages expanded state)
// ---------------------------------------------------------------------------

export function ItemsList({ items }: { items: Item[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          isExpanded={expandedId === item.id}
          onToggleExpand={() =>
            setExpandedId(expandedId === item.id ? null : item.id)
          }
        />
      ))}
    </div>
  );
}
