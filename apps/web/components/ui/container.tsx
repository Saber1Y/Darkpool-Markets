import { HTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "lg", children, ...props }, ref) => {
    const sizes = {
      sm: "max-w-3xl",
      md: "max-w-4xl",
      lg: "max-w-6xl",
      xl: "max-w-7xl",
      full: "max-w-full"
    };

    return (
      <div ref={ref} className={cn("mx-auto w-full px-5", sizes[size], className)} {...props}>
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";