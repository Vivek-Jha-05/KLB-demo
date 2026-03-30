import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ProductImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
  src,
  alt,
  className,
  onError,
  ...props
}) => {
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    setHasError(!src);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={cn('flex items-center justify-center bg-slate-100 text-slate-400', className)}>
        <ImageOff className="h-5 w-5" />
        <span className="sr-only">{alt || 'Product image unavailable'}</span>
      </div>
    );
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        setHasError(true);
        onError?.(event);
      }}
    />
  );
};
