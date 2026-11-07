import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-sm hover:bg-blue-800",
        outline: "border-line bg-white text-ink shadow-xs hover:bg-slate-50",
        ghost: "text-muted hover:bg-blue-50 hover:text-primary",
      },
      size: { default: "h-9 px-3.5", sm: "h-8 px-2.5 text-xs", icon: "size-8" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({ asChild, className, variant, size, ...props }: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
