import React from 'react';
import clsx from 'clsx';

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  className?: string;
};

export const Skeleton: React.FC<SkeletonProps> = ({ width, height, className }) => (
  <div
    className={clsx('animate-pulse rounded bg-gray-300 dark:bg-gray-700', className)}
    style={{ width, height }}
  />
); 