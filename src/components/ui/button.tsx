import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-[#0a3aa0] bg-gradient-to-b from-[#5fa8f5] via-[#2f7fe6] to-[#1152c4] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_2px_4px_rgba(10,30,80,0.3)] hover:brightness-105 active:brightness-95",
        destructive:
          "border-[#8a1f10] bg-gradient-to-b from-[#f28a7a] to-[#c22a1a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] hover:brightness-105",
        outline: "border-border bg-white text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-secondary",
        secondary:
          "border-border bg-gradient-to-b from-white to-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:brightness-105",
        ghost: "border-transparent hover:bg-secondary/60",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
