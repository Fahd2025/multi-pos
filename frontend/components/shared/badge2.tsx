import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("px-2 py-1 rounded-full text-xs", {
  variants: {
    variant: {
      green:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    },
  },
  defaultVariants: {
    variant: "green",
  },
});

function Badge2({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge2, badgeVariants };
