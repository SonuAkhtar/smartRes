import "./Spinner.css";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  color?: string;
  className?: string;
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
