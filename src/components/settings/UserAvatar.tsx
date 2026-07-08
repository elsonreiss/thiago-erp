import { User as UserIcon } from "lucide-react";

interface UserAvatarLike {
  name: string;
  photo: string | null;
}

export function UserAvatar({ user, size = 32 }: { user: UserAvatarLike; size?: number }) {
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  const style = { width: size, height: size };

  if (user.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.photo}
        alt={user.name}
        style={style}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-ui-primary font-semibold text-ui-primary-foreground"
    >
      {initials || <UserIcon size={Math.round(size * 0.5)} />}
    </div>
  );
}
