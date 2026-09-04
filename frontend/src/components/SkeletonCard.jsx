export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#0B192C] border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden animate-pulse">
      <div className="bg-slate-200 dark:bg-slate-700 aspect-square w-full" />

      <div className="p-5 space-y-3">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full mt-2" />
      </div>
    </div>
  );
}