import { Star } from "lucide-react";

export default function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5 text-caramel" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-5 w-5"
          fill={i < count ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}
