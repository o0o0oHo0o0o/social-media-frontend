import { formatDistanceToNow } from "date-fns";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Reaction from "./Reaction";
import OptionButton from "../Common/OptionButton";
import { useEffect, useMemo, useState } from "react";
import Modal from "../Common/Modal";
import { PostApi, UserApi } from "../../utils/feedApi";

const resolvedAvatarCache = new Map();
const avatarLookupInFlight = new Map();

function isUsableAvatarUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("/") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  );
}

async function resolveAvatarFromProfile(username) {
  const key = String(username || "").trim().toLowerCase();
  if (!key) return "";

  if (resolvedAvatarCache.has(key)) {
    return resolvedAvatarCache.get(key);
  }

  if (avatarLookupInFlight.has(key)) {
    return avatarLookupInFlight.get(key);
  }

  const request = UserApi.getProfileByUsername(username)
    .then(async (response) => {
      if (!response.ok) return "";
      const data = await response.json();
      const url = String(
        data?.avatarUrl ||
        data?.profilePictureURL ||
        data?.profilePictureUrl ||
        "",
      ).trim();
      const resolved = isUsableAvatarUrl(url) ? url : "";
      resolvedAvatarCache.set(key, resolved);
      return resolved;
    })
    .catch(() => "")
    .finally(() => {
      avatarLookupInFlight.delete(key);
    });

  avatarLookupInFlight.set(key, request);
  return request;
}

function splitFirstSentence(text) {
  if (!text || typeof text !== "string") return ["", ""];

  const match = text.match(/^.*?[.!?](?=\s|$)/s);
  if (!match) {
    return [text.trim(), ""];
  }

  const firstSentence = match[0].trim();
  const rest = text.slice(match[0].length).trim();
  return [firstSentence, rest];
}

const FeedItem = ({
  userId,
  post,
  openPost,
  openUser,
  goBack,
  small,
  isAuthenticated,
  onRequireAuth,
}) => {
  const [title, content] = splitFirstSentence(post?.content || "");
  const [modalOpen, setModalOpen] = useState(false);

  const author = post?.user || {};
  const username = author?.username || author?.userName || "unknown";
  const displayName = author?.name || author?.fullName || username;
  const rawAvatarUrl = useMemo(() => {
    const raw =
      author?.avatarUrl ||
      author?.profilePictureURL ||
      author?.profilePictureUrl ||
      author?.avatar ||
      "";
    const normalized = String(raw || "").trim();
    return normalized || "";
  }, [author]);
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState(
    isUsableAvatarUrl(rawAvatarUrl) ? rawAvatarUrl : "",
  );
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [retriedFromProfile, setRetriedFromProfile] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
    setRetriedFromProfile(false);
    setResolvedAvatarUrl(isUsableAvatarUrl(rawAvatarUrl) ? rawAvatarUrl : "");
  }, [rawAvatarUrl]);

  useEffect(() => {
    let cancelled = false;

    const fillAvatarIfNeeded = async () => {
      if (isUsableAvatarUrl(rawAvatarUrl) || !username) {
        return;
      }

      const fromProfile = await resolveAvatarFromProfile(username);
      if (!cancelled && fromProfile) {
        setResolvedAvatarUrl(fromProfile);
      }
    };

    fillAvatarIfNeeded();
    return () => {
      cancelled = true;
    };
  }, [rawAvatarUrl, username]);

  const medias = Array.isArray(post?.medias) ? post.medias : [];

  const handleAvatarError = async () => {
    if (retriedFromProfile || !username) {
      setAvatarFailed(true);
      return;
    }

    setRetriedFromProfile(true);
    const fromProfile = await resolveAvatarFromProfile(username);
    if (fromProfile && fromProfile !== resolvedAvatarUrl) {
      setResolvedAvatarUrl(fromProfile);
      setAvatarFailed(false);
      return;
    }

    setAvatarFailed(true);
  };

  const onEdit = () => {
    setModalOpen(true);
  };

  const onDelete = async () => {
    await PostApi.deletePost(post);
  };

  return (
    <div key={post?.id} className="collection-card post-card">
      <div className="post-container">
        <div className="post-text">
          <div className="post-header">
            {goBack && (
              <button
                className="back-button"
                onClick={() => {
                  goBack();
                }}
              >
                <svg
                  rpl=""
                  className="rpl-rtl-icon"
                  fill="currentColor"
                  height="16"
                  icon-name="arrow-back"
                  viewBox="0 0 20 20"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.5 9.1H4.679l5.487-5.462a.898.898 0 00.003-1.272.898.898 0 00-1.272-.003l-7.032 7a.898.898 0 000 1.275l7.03 7a.896.896 0 001.273-.003.898.898 0 00-.002-1.272l-5.487-5.462h12.82a.9.9 0 000-1.8z"></path>
                </svg>
              </button>
            )}

            <div className="post-header-info featured-content">
              <div className="user-info" onClick={(e) => e.stopPropagation()}>
                <span className="profile-image">
                  {resolvedAvatarUrl && !avatarFailed ? (
                    <img
                      src={resolvedAvatarUrl}
                      alt={`${displayName} avatar`}
                      className="icon avatar"
                      referrerPolicy="no-referrer"
                      onError={handleAvatarError}
                    />
                  ) : (
                    <div className="icon avatar" aria-hidden="true">
                      {(displayName || username).charAt(0).toUpperCase()}
                    </div>
                  )}
                </span>

                <h3
                  className="card-author"
                  onClick={() => {
                    openUser?.(author);
                  }}
                  title={`@${username}`}
                >
                  {displayName}
                </h3>

                {!small && (
                  <>
                    <span className="card-subtitle">@{username}</span>
                    {post?.location ? (
                      <>
                        {"•"}
                        <span className="card-subtitle">{post.location}</span>
                      </>
                    ) : null}
                    {post?.createdAt ? (
                      <>
                        {"•"}
                        <span className="card-subtitle">
                          Posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                      </>
                    ) : null}
                    {post?.updatedAt ? (
                      <>
                        {"•"}
                        <span className="card-subtitle">
                          Updated {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                        </span>
                      </>
                    ) : null}
                  </>
                )}
              </div>

              {!small && <span className="post-topic">{post?.postTopic}</span>}
            </div>

            {!small && <OptionButton onEdit={onEdit} onDelete={onDelete} onReport={() => { }}></OptionButton>}

            <Modal
              userId={userId}
              postId={post?.id}
              titleInput={title}
              textInput={content}
              medias={medias.filter((media) => media.mediaType === "IMAGE")}
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false);
              }}
            ></Modal>
          </div>

          <h2 className="post-title" onClick={openPost && (() => openPost(post))}>
            {title}
          </h2>
          <p className="post-content" onClick={openPost && (() => openPost(post))}>
            {content}
          </p>
        </div>

        {medias.length > 0 ? (
          <div className="post-media">
            <Carousel showArrows={true} showThumbs={false} showStatus={false}>
              {medias
                .filter((media) => media.mediaType === "IMAGE")
                .map((media) => (
                  <div key={media.id} className="image-container">
                    <div
                      className="background-image"
                      style={{
                        backgroundImage: `url(${media.mediaURL}), url(${media.fileName})`,
                      }}
                    ></div>
                    <img
                      src={media.mediaURL}
                      alt=""
                      onError={(e) => {
                        e.target.src = `${media.fileName}`;
                      }}
                    />
                  </div>
                ))}
            </Carousel>
          </div>
        ) : null}
      </div>

      <div className="post-footer">
        {!small && (
          <Reaction
            userId={userId}
            userReaction={post?.userReaction}
            reactions={post?.reactionCount || post?.reactionCounts}
            interactableId={post?.interactableItemId}
            entityId={post?.id}
            targetType="POST"
            isAuthenticated={isAuthenticated}
            onRequireAuth={onRequireAuth}
          ></Reaction>
        )}

        <button
          className="highlight-item"
          onClick={() => {
            if (!isAuthenticated) {
              onRequireAuth?.("bình luận");
              return;
            }
            openPost?.(post);
          }}
        >
          <svg
            rpl=""
            aria-hidden="true"
            className="icon-comment"
            fill="currentColor"
            height="16"
            icon-name="comment"
            viewBox="0 0 20 20"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 1a9 9 0 00-9 9c0 1.947.79 3.58 1.935 4.957L.231 17.661A.784.784 0 00.785 19H10a9 9 0 009-9 9 9 0 00-9-9zm0 16.2H6.162c-.994.004-1.907.053-3.045.144l-.076-.188a36.981 36.981 0 002.328-2.087l-1.05-1.263C3.297 12.576 2.8 11.331 2.8 10c0-3.97 3.23-7.2 7.2-7.2s7.2 3.23 7.2 7.2-3.23 7.2-7.2 7.2z"></path>
          </svg>
          <span className="highlight-title">{post?.commentCount || 0} Comments</span>
        </button>

        <button className="highlight-item">
          <svg
            rpl=""
            aria-hidden="true"
            className="icon-share rpl-rtl-icon"
            fill="currentColor"
            height="16"
            icon-name="share"
            viewBox="0 0 20 20"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M14.984 2A2.984 2.984 0 1016.9 7.27l-5.692 3.163a2.966 2.966 0 00-4.154-.26L4.94 8.473a2.984 2.984 0 10-1.163 1.47l2.08 1.764a2.984 2.984 0 102.607-.157l5.689-3.162A2.984 2.984 0 1014.984 2z"></path>
          </svg>
          <span className="highlight-title">{post?.shareCount || 0} Share</span>
        </button>
      </div>
    </div>
  );
};

export default FeedItem;
