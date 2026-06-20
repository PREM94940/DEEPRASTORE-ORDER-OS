export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8 bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
        <p className="text-sm text-zinc-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}
