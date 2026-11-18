import React, { useCallback, useEffect, useState } from 'react';

interface ImageWithSkeletonProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  skeletonClassName?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  imgRef?: React.RefObject<HTMLImageElement | null>;
  fallback?: React.ReactNode;
  id?: string;
}

export function ImageWithSkeleton({
  src,
  alt,
  className = 'w-full h-full object-cover',
  wrapperClassName = 'relative w-full h-full overflow-hidden',
  skeletonClassName = 'bg-neutral-200 dark:bg-neutral-800',
  loading = 'lazy',
  fetchPriority = 'auto',
  imgRef: externalRef,
  fallback,
  id,
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const el = externalRef?.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src, externalRef]);

  const setRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (externalRef) {
        externalRef.current = node;
      }
      if (node && node.complete && node.naturalWidth > 0) {
        setLoaded(true);
      }
    },
    [externalRef]
  );

  if (failed && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={wrapperClassName}>
      {!loaded && !failed && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 z-0 animate-pulse ${skeletonClassName}`}
        />
      )}
      <img
        id={id}
        ref={setRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          setFailed(true);
        }}
        referrerPolicy="no-referrer"
        className={`relative z-10 ${className}`}
      />
    </div>
  );
}
