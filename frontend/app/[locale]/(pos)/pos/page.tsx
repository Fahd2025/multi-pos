import { Suspense } from "react";
import PosLayout from "@/components/pos/PosLayout";

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading POS...</p>
      </div>
    </div>
  );
}

export default function Pos2Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PosLayout />
    </Suspense>
  );
}
