import { HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "ghost";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant = "default", children, ...props }, ref) => {
  const variants = {
    default: "bg-slate-900/50 border border-slate-800/70",
    bordered: "bg-transparent border border-slate-700",
    ghost: "bg-transparent"
  };

  return (
    <div ref={ref} className={cn("rounded-xl p-5", variants[variant], className)} {...props}>
      {children}
    </div>
  );
});

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold text-slate-100", className)} {...props}>
      {children}
    </h3>
  )
);

CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-slate-300", className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = "CardContent";