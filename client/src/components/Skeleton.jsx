import React from 'react';

export const ProductCardSkeleton = () => {
  return (
    <div className="animate-pulse flex flex-col space-y-3">
      <div className="bg-neutral-200 dark:bg-neutral-800 h-72 w-full rounded-sm"></div>
      <div className="bg-neutral-200 dark:bg-neutral-800 h-4 w-3/4 rounded-sm"></div>
      <div className="bg-neutral-200 dark:bg-neutral-800 h-4 w-1/4 rounded-sm"></div>
    </div>
  );
};

export const TableRowSkeleton = () => {
  return (
    <tr className="animate-pulse border-b border-neutral-200 dark:border-neutral-800">
      <td className="p-4"><div className="bg-neutral-200 dark:bg-neutral-800 h-4 w-16 rounded-sm"></div></td>
      <td className="p-4"><div className="bg-neutral-200 dark:bg-neutral-800 h-4 w-32 rounded-sm"></div></td>
      <td className="p-4"><div className="bg-neutral-200 dark:bg-neutral-800 h-4 w-24 rounded-sm"></div></td>
      <td className="p-4"><div className="bg-neutral-200 dark:bg-neutral-800 h-4 w-20 rounded-sm"></div></td>
    </tr>
  );
};

export default ProductCardSkeleton;
