type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-slate-700 border-t-teal-500 ${className}`} />
  );
}

export function LoadingPage() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}