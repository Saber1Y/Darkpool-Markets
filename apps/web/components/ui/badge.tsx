import { HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-slate-800 text-slate-300",
      success: "bg-emerald-900/40 text-emerald-200",
      warning: "bg-amber-900/40 text-amber-200",
      danger: "bg-red-900/40 text-red-200",
      info: "bg-teal-900/40 text-teal-200"
    };

    return (
      <span
        ref={ref}
        className={cn("inline-flex items-center rounded px-2 py-1 text-xs font-medium", variants[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";