import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-5 text-center">
      <h1 className="text-3xl font-semibold">Market not found</h1>
      <p className="mt-2 text-slate-400">The requested market could not be loaded from the local chain.</p>
      <Link href="/" className="mt-5 rounded border border-teal-500/40 px-4 py-2 text-sm text-teal-300">
        Back to dashboard
      </Link>
    </main>
  );
}
