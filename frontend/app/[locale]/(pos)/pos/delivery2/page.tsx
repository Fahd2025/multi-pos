"use client";

import React, { Suspense } from "react";
import { DeliveryManagerPage } from "@/components/pos/delivery2/DeliveryManagerPage";

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading delivery management...</p>
      </div>
    </div>
  );
}

export default function Delivery2Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DeliveryManagerPage />
    </Suspense>
  );
}
