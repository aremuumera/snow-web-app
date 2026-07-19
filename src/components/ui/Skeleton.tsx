"use client";

import React from "react";

interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular" | "table" | "card" | "form";
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
  cols?: number; // Specific to table variant
}

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  className = "",
  count = 1,
  cols = 8,
}: SkeletonProps) {
  const getStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (width !== undefined) {
      style.width = typeof width === "number" ? `${width}px` : width;
    }
    if (height !== undefined) {
      style.height = typeof height === "number" ? `${height}px` : height;
    }
    return style;
  };

  // 1. Table variant skeleton
  if (variant === "table") {
    return (
      <table className="w-full text-left border-collapse min-w-[700px] select-none">
        <thead>
          <tr className="border-b border-border-light dark:border-border-dark text-[11px] font-primary-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark bg-light-50/50 dark:bg-dark-900/30">
            {Array.from({ length: cols }).map((_, idx) => (
              <th key={`th-${idx}`} className="py-4 px-6">
                <div className="h-3 bg-light-200 dark:bg-dark-300 rounded w-16 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light dark:divide-border-dark">
          {Array.from({ length: count }).map((_, rIdx) => (
            <tr key={`tr-${rIdx}`} className="animate-pulse">
              {Array.from({ length: cols }).map((_, cIdx) => (
                <td key={`td-${rIdx}-${cIdx}`} className="py-4 px-6">
                  {cIdx === 1 ? (
                    /* Service type icon col */
                    <div className="flex items-center gap-2.5">
                      <div className="w-[30px] h-[30px] bg-light-200 dark:bg-dark-300 rounded-full" />
                      <div className="h-4 bg-light-200 dark:bg-dark-300 rounded w-16" />
                    </div>
                  ) : cIdx === 2 ? (
                    /* Description col */
                    <div className="h-4 bg-light-200 dark:bg-dark-300 rounded w-44" />
                  ) : (
                    /* Standard info cols */
                    <div className="h-4 bg-light-200 dark:bg-dark-300 rounded w-20" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // 2. Card variant skeleton
  if (variant === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={`card-${idx}`}
            className="p-6 rounded-[24px] border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col gap-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-light-200 dark:bg-dark-300 rounded-full" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 bg-light-200 dark:bg-dark-300 rounded w-1/2" />
                <div className="h-3 bg-light-200 dark:bg-dark-300 rounded w-1/3" />
              </div>
            </div>
            <div className="h-3 bg-light-200 dark:bg-dark-300 rounded w-full" />
            <div className="h-3 bg-light-200 dark:bg-dark-300 rounded w-3/4" />
            <div className="h-10 bg-light-200 dark:bg-dark-300 rounded-xl w-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  // 3. Form fields variant skeleton
  if (variant === "form") {
    return (
      <div className="flex flex-col gap-5 w-full animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={`form-field-${idx}`} className="flex flex-col gap-2">
            <div className="h-3.5 bg-light-200 dark:bg-dark-300 rounded w-24" />
            <div className="h-12 bg-light-200 dark:bg-dark-300 rounded-[20px] w-full" />
          </div>
        ))}
        <div className="h-14 bg-light-200 dark:bg-dark-300 rounded-full w-full mt-4" />
      </div>
    );
  }

  // Helper single elements (text, circular, rectangular)
  const baseClasses = "bg-light-200 dark:bg-dark-300 animate-pulse";
  const shapeClasses =
    variant === "circular"
      ? "rounded-full"
      : variant === "text"
      ? "rounded h-3.5 w-full"
      : "rounded-[20px]";

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`element-${idx}`}
          style={getStyle()}
          className={`${baseClasses} ${shapeClasses} ${className}`}
        />
      ))}
    </div>
  );
}
export default Skeleton;
