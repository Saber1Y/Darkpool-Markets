type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "Error", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-900/50 bg-red-900/10 p-8 text-center">
      <p className="text-lg font-medium text-red-200">{title}</p>
      <p className="mt-1 text-sm text-red-300/80">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-2 text-sm text-red-200 transition hover:bg-red-900/30"
        >
          Try Again
        </button>
      )}
    </div>
  );
}