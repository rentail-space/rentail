export default function LoadingImage({
  alt,
  url,
  maxHeight,
  minHeight = maxHeight,
}: {
  alt: string;
  url: string;
  maxHeight: number;
  minHeight?: number;
}) {
  return (
    <figure
      className="max-fill overflow-hidden border-black border-y-2"
      style={{
        background:
          "repeating-linear-gradient(135deg, #e5e7eb 0 24px, #fff 24px 48px)",
        maxHeight,
        minHeight,
      }}
    >
      <img
        alt={alt}
        onLoad={(e) => {
          e.currentTarget.classList.remove("opacity-0");
        }}
        onError={(e) => {
          e.currentTarget.remove();
        }}
        src={url}
        className="h-full w-full object-cover object-center opacity-0"
      />
    </figure>
  );
}
