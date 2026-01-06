import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

export default function LoadingImage({
  alt,
  figureClassName,
  imgClassName,
  maxHeight,
  minHeight = maxHeight,
  src,
}: {
  alt: string;
  figureClassName?: string;
  imgClassName?: string;
  maxHeight: number;
  minHeight?: number;
  src: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // NOTE React doesn't fire onLoad for SSR, so we need this hack.
    if (imgRef.current?.complete) imgRef.current.classList.remove("opacity-0");
  }, []);

  return (
    <figure
      className={cn("w-full overflow-hidden", figureClassName)}
      style={{
        background:
          "repeating-linear-gradient(135deg, #e5e7eb 0 24px, #fff 24px 48px)",
        maxHeight,
        minHeight,
      }}
    >
      <img
        alt={alt}
        className={cn(
          "h-full w-full object-cover object-center opacity-0",
          imgClassName,
        )}
        onError={(e) => {
          e.currentTarget.remove();
        }}
        onLoad={(e) => {
          e.currentTarget.classList.remove("opacity-0");
        }}
        ref={imgRef}
        src={src}
      />
    </figure>
  );
}
