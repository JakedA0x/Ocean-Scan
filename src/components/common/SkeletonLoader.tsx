import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
  return (
    <div className="w-full divide-y divide-[#DCE8F0] animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E8F3FA]" />
            <div className="space-y-1.5">
              <div className="w-28 h-4 rounded bg-[#E8F3FA]" />
              <div className="w-16 h-3 rounded bg-[#F2F8FC]" />
            </div>
          </div>
          <div className="w-20 h-4 rounded bg-[#E8F3FA]" />
          <div className="w-16 h-4 rounded bg-[#E8F3FA]" />
          <div className="w-20 h-4 rounded bg-[#E8F3FA]" />
          <div className="w-20 h-4 rounded bg-[#E8F3FA]" />
          <div className="w-16 h-4 rounded bg-[#E8F3FA]" />
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#DCE8F0] p-5 space-y-3">
          <div className="w-24 h-3 rounded bg-[#E8F3FA]" />
          <div className="w-32 h-6 rounded bg-[#E8F3FA]" />
          <div className="w-40 h-3 rounded bg-[#F2F8FC]" />
        </div>
      ))}
    </div>
  );
};
