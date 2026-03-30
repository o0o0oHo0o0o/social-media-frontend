import React, { useEffect, useMemo, useState } from "react";
import { UserApi } from "../../utils/feedApi";
import "../../styles/optionButton.css"; // optional, see CSS at the bottom

function ProfileButton({ openUser, user, onLogout, isDark, setIsDark }) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  const username = useMemo(
    () => String(user?.username || user?.userName || "").trim(),
    [user],
  );

  const displayName = useMemo(
    () =>
      String(
        user?.fullName || user?.name || user?.username || user?.userName || "U",
      ).trim(),
    [user],
  );

  const fallbackAvatar = useMemo(
    () =>
      String(
        user?.avatarUrl || user?.profilePictureURL || user?.profilePictureUrl || user?.avatar || "",
      ).trim(),
    [user],
  );

  useEffect(() => {
    let cancelled = false;

    const loadAvatar = async () => {
      if (!username) {
        setAvatarUrl(fallbackAvatar);
        return;
      }

      try {
        const response = await UserApi.getProfileByUsername(username);
        if (!response.ok) {
          if (!cancelled) {
            setAvatarUrl(fallbackAvatar);
          }
          return;
        }

        const profile = await response.json();
        const apiAvatar = String(
          profile?.avatarUrl ||
          profile?.profilePictureURL ||
          profile?.profilePictureUrl ||
          profile?.avatar ||
          "",
        ).trim();

        if (!cancelled) {
          setAvatarUrl(apiAvatar || fallbackAvatar);
        }
      } catch (error) {
        if (!cancelled) {
          setAvatarUrl(fallbackAvatar);
        }
      }
    };

    loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [username, fallbackAvatar]);

  const toggle = () => {
    if (isDark) {
      localStorage.setItem("theme", "light");
    } else {
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  return (
    <div className="post-menu profile">
      <button
        className="post-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        aria-label="Open profile menu"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="profile-avatar" />
        ) : (
          <span className="profile-avatar-fallback" aria-hidden="true">
            {(displayName[0] || "U").toUpperCase()}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="post-menu-dropdown">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setIsOpen(false);
              openUser(user);
            }}
            className="post-menu-item"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 16 16"
            >
              <g
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              >
                <circle cx="8" cy="6" r="3.25" />
                <path d="m2.75 14.25c0-2.5 2-5 5.25-5s5.25 2.5 5.25 5" />
              </g>
            </svg>
            Profile
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            className="post-menu-item profile-setting"
          >
            <div className="darkmode container">
              <svg
                rpl=""
                fill="currentColor"
                height="20"
                icon-name="night"
                viewBox="0 0 20 20"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.642 18.642a8.946 8.946 0 01-8.073-5.04 1.625 1.625 0 01.205-1.76 1.602 1.602 0 011.659-.545c.938.243 1.907.27 2.877.081 2.535-.496 4.572-2.532 5.068-5.068a6.44 6.44 0 00-.082-2.876 1.602 1.602 0 01.546-1.66 1.628 1.628 0 011.76-.205c3.365 1.65 5.33 5.134 5.005 8.874-.371 4.283-3.881 7.793-8.163 8.165a9.402 9.402 0 01-.802.034zm-6.293-5.517a7.175 7.175 0 006.938 3.688c3.424-.297 6.229-3.103 6.526-6.527a7.162 7.162 0 00-3.688-6.938 8.236 8.236 0 01.019 3.307c-.635 3.246-3.242 5.854-6.488 6.49a8.272 8.272 0 01-3.307-.02z"></path>
              </svg>
              <span className="text">Dark mode</span>
              <input
                type="checkbox"
                id="toggle"
                checked={isDark}
                onChange={toggle}
              />
              <label htmlFor="toggle" className="switch"></label>
            </div>
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="post-menu-item profile-logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="m17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5M4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4z"
              />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileButton;
