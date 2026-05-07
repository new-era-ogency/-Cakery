import { useRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

/**
 * Anchor button that subtly follows the cursor. Honors reduced-motion.
 * Implemented with vanilla mousemove math — no animation library needed.
 */
export default function MagneticButton({
  children,
  className = "",
  ...rest
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `translate3d(${x * 0.18}px, ${y * 0.18}px, 0)`;
  };
  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "translate3d(0,0,0)";
  };

  return (
    <a
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`inline-block transition-transform duration-300 ease-silk ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
}
