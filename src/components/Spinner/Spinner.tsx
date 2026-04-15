import "./Spinner.css";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  /** Inherit color from parent (default) or override with a CSS color */
  color?: string;
  className?: string;
  /** For screen readers - defaults to "Loading" */
  label?: string;
}

export default function Spinner({
  size = "md",
  color,
  className = "",
  label = "Loading",
}: SpinnerProps) {
  return (
    <span
      className={`spinner spinner--${size} ${className}`}
      style={
        color
          ? ({ "--spinner-color": color } as React.CSSProperties)
          : undefined
      }
      role="status"
      aria-label={label}
    />
  );
}
