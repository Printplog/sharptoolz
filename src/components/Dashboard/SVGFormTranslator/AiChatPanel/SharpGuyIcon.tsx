interface SharpGuyIconProps {
  size?: number;
  className?: string;
}

export default function SharpGuyIcon({ size = 28, className = "" }: SharpGuyIconProps) {
  return (
    <img
      src="/sharpguy.png"
      width={size}
      height={size}
      alt="Sharp Guy"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
