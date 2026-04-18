interface AvatarProps {
  name: string;
  image: string | null;
  size?: number;
}

export function Avatar({ name, image, size = 24 }: AvatarProps) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full bg-accent/20 text-accent flex items-center justify-center font-medium flex-shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
