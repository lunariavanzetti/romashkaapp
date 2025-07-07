import React from 'react';

export const Loader: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div className="flex items-center justify-center">
    <span
      className="inline-block animate-spin rounded-full border-4 border-primary-pink border-t-transparent border-solid"
      style={{ width: size, height: size }}
    />
  </div>
); 