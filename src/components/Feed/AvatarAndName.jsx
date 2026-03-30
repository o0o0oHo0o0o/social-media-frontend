import { useEffect, useMemo, useState } from "react";

const AvatarAndName = ({ target, openUser }) => {
  const [hasError, setHasError] = useState(false);

  const avatarSrc = useMemo(() => {
    const raw =
      target?.avatarUrl ||
      target?.profilePictureURL ||
      target?.profilePictureUrl ||
      target?.avatar ||
      "";
    const normalized = String(raw || "").trim();
    return normalized || undefined;
  }, [target]);

  useEffect(() => {
    setHasError(false);
  }, [avatarSrc]);

  const username = target?.username || target?.userName || "Unknown";
  const displayName = target?.fullName || target?.name || username;

  return (
    <div className="avatar-name" onClick={() => openUser && openUser(target)}>
      {avatarSrc && !hasError ? (
        <img
          src={avatarSrc}
          alt={`${username} avatar`}
          className="icon avatar"
          onError={() => setHasError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="icon avatar" aria-hidden="true">
          {username?.[0]?.toUpperCase() || "U"}
        </div>
      )}
      <span className="username">{displayName}</span>
    </div>
  );
};

export default AvatarAndName;
