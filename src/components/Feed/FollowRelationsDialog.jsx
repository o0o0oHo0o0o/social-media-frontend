import React, { useEffect, useMemo, useState } from "react";
import Dialog from "../Common/Dialog";
import { FollowApi } from "../../utils/feedApi";

const TAB_CONFIG = {
  followers: { label: "Followers" },
  following: { label: "Following" },
  friends: { label: "Friends" },
};

function getUsername(user) {
  return user?.username || user?.userName || "";
}

function getDisplayName(user) {
  return user?.fullName || user?.displayName || getUsername(user) || "Unknown";
}

function getAvatar(user) {
  const raw = user?.avatarUrl || user?.profilePictureURL || user?.profilePictureUrl || "";
  const normalized = String(raw || "").trim();
  return normalized || undefined;
}

function getMutualFollow(user) {
  return Boolean(user?.mutualFollow ?? user?.isMutualFollow);
}

export default function FollowRelationsDialog({
  open,
  onClose,
  targetUsername,
  currentUsername,
  initialTab = "followers",
  onRequireAuth,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [rows, setRows] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  const isOwnProfile =
    Boolean(targetUsername) &&
    Boolean(currentUsername) &&
    String(targetUsername).toLowerCase() === String(currentUsername).toLowerCase();

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const loadRows = async (tab) => {
    if (!targetUsername) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError("");
    setHint("");

    try {
      let result;
      if (tab === "followers") {
        result = await FollowApi.getFollowers(targetUsername);
      } else if (tab === "following") {
        result = await FollowApi.getFollowing(targetUsername);
      } else {
        result = await FollowApi.getFriends(targetUsername);
      }

      if (!result?.ok) {
        if (tab === "following" && Number(result?.status) >= 500) {
          throw new Error("Following list is temporarily unavailable (server error). Please try again later.");
        }
        throw new Error(`Unable to load follow relationships (${result?.status || 500})`);
      }

      let list = Array.isArray(result.data) ? result.data : [];

      if (tab === "following" && list.length === 0) {
        const fallback = await FollowApi.getFollowers(targetUsername);
        if (fallback?.ok) {
          const fallbackList = Array.isArray(fallback.data) ? fallback.data : [];
          if (fallbackList.length > 0) {
            list = fallbackList;
            setHint("Showing fallback list from followers because following returned empty.");
          }
        }
      }

      setRows(list);

      // For own profile followers list: decide Follow back vs Friend.
      if (tab === "followers" && isOwnProfile) {
        const nextStatus = Object.fromEntries(
          list
            .map((u) => {
              const uname = getUsername(u);
              if (!uname) return null;
              return [uname, { isFollowing: getMutualFollow(u) }];
            })
            .filter(Boolean),
        );

        const needChecks = list.filter((u) => {
          const uname = getUsername(u);
          return uname && !nextStatus[uname]?.isFollowing;
        });

        await Promise.all(
          needChecks.map(async (u) => {
            const uname = getUsername(u);
            if (!uname) return;
            try {
              const resp = await FollowApi.checkUser(uname);
              if (resp.ok) {
                const isFollowing = await resp.json();
                nextStatus[uname] = { isFollowing: Boolean(isFollowing) };
              }
            } catch (e) {
              // ignore per-user failures
            }
          }),
        );
        setStatusMap(nextStatus);
      } else {
        setStatusMap({});
      }
    } catch (e) {
      setRows([]);
      setStatusMap({});
      setHint("");
      setError(e.message || "Unable to load follow relationships.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadRows(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, targetUsername, currentUsername]);

  const handleFollowBack = async (username) => {
    if (!currentUsername) {
      onRequireAuth?.("follow back");
      return;
    }

    setActionLoading((prev) => ({ ...prev, [username]: true }));
    setError("");
    try {
      const resp = await FollowApi.addUser(username);
      if (!resp.ok) {
        throw new Error(`Follow back failed (HTTP ${resp.status})`);
      }
      setStatusMap((prev) => ({
        ...prev,
        [username]: { isFollowing: true },
      }));
    } catch (e) {
      setError(e.message || "Unable to follow back right now.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [username]: false }));
    }
  };

  const title = useMemo(
    () => `Follow relationships - ${TAB_CONFIG[activeTab]?.label || "Followers"}`,
    [activeTab],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      className="follow-relations-dialog"
      backdropClassName="follow-relations-backdrop"
      actions={
        <button className="dialog-btn" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="follow-dialog-tabs">
        {Object.entries(TAB_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            className={`follow-tab ${activeTab === key ? "active" : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {loading ? <div className="follow-list-empty">Loading...</div> : null}
      {!loading && error ? <div className="follow-list-error">{error}</div> : null}
      {!loading && !error && hint ? <div className="follow-list-empty">{hint}</div> : null}
      {!loading && !error && rows.length === 0 ? (
        <div className="follow-list-empty">No results found.</div>
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <div className="follow-list">
          {rows.map((u) => {
            const username = getUsername(u);
            const displayName = getDisplayName(u);
            const avatar = getAvatar(u);
            const relation = statusMap[username];
            const isMutual = getMutualFollow(u) || relation?.isFollowing;

            const showFollowBack =
              activeTab === "followers" && isOwnProfile && !isMutual;

            const relationLabel =
              activeTab === "friends"
                ? "Friend"
                : activeTab === "following"
                  ? "Following"
                  : isMutual
                    ? "Friend"
                    : "Follower";

            return (
              <div key={username || displayName} className="follow-row">
                <div className="follow-user">
                  {avatar ? (
                    <img src={avatar || undefined} alt={displayName} className="follow-avatar" />
                  ) : (
                    <div className="follow-avatar follow-avatar-fallback">
                      {displayName?.[0] || "U"}
                    </div>
                  )}
                  <div className="follow-meta">
                    <div className="follow-name">{displayName}</div>
                    <div className="follow-username">@{username || "unknown"}</div>
                  </div>
                </div>

                <div className="follow-actions">
                  {showFollowBack ? (
                    <button
                      type="button"
                      className="follow-back-btn"
                      disabled={Boolean(actionLoading[username])}
                      onClick={() => handleFollowBack(username)}
                    >
                      {actionLoading[username] ? "Processing..." : "Follow back"}
                    </button>
                  ) : (
                    <span className="follow-relation-badge">{relationLabel}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </Dialog>
  );
}
