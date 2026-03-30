import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

import { formatDistanceToNow } from "date-fns"; // Import the function to format dates
import "../../styles/userInfoCard.css"; // We'll add the CSS below
import AvatarAndName from "./AvatarAndName";
import { FollowApi } from "../../utils/feedApi";
import api from "../../services/api";
import FollowRelationsDialog from "./FollowRelationsDialog";

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

async function getCroppedAvatarFile(imageSrc, zoom = 1, offsetX = 0, offsetY = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const outputSize = 512;
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Cannot process image for cropping.");
  }

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const shortest = Math.min(sourceWidth, sourceHeight);
  const cropSide = shortest / clamp(zoom, 1, 3);
  const maxX = Math.max(0, sourceWidth - cropSide);
  const maxY = Math.max(0, sourceHeight - cropSide);

  const centerX = sourceWidth / 2 + (clamp(offsetX, -100, 100) / 100) * (maxX / 2);
  const centerY = sourceHeight / 2 + (clamp(offsetY, -100, 100) / 100) * (maxY / 2);
  const sx = clamp(centerX - cropSide / 2, 0, maxX);
  const sy = clamp(centerY - cropSide / 2, 0, maxY);

  ctx.drawImage(
    image,
    sx,
    sy,
    cropSide,
    cropSide,
    0,
    0,
    outputSize,
    outputSize,
  );

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });

  if (!blob) {
    throw new Error("Failed to create cropped image.");
  }

  return new File([blob], `avatar-${Date.now()}.jpg`, { type: "image/jpeg" });
}

const UserInfoCard = ({ user, target, postNumber, onRequireAuth }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [followed, setFollowed] = useState(false);
  const [isCheckingFollow, setIsCheckingFollow] = useState(false);
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState("");
  const [followError, setFollowError] = useState("");
  const [relationsOpen, setRelationsOpen] = useState(false);
  const [relationsTab, setRelationsTab] = useState("followers");
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const getUsername = (obj) => obj?.username ?? obj?.userName ?? "";
  const currentUsername = getUsername(user);
  const targetUsername = getUsername(target);

  const isOwnProfile =
    Boolean(currentUsername) &&
    Boolean(targetUsername) &&
    String(currentUsername).toLowerCase() === String(targetUsername).toLowerCase();

  useEffect(() => {
    setLocalAvatarUrl(
      target?.avatarUrl || target?.profilePictureURL || target?.profilePictureUrl || "",
    );
  }, [target]);

  const displayTarget = {
    ...target,
    avatarUrl: localAvatarUrl || target?.avatarUrl || target?.profilePictureURL || target?.profilePictureUrl || "",
    username: targetUsername,
  };

  useEffect(() => {
    let cancelled = false;

    const fetchFollowStatus = async () => {
      if (!currentUsername || isOwnProfile || !targetUsername) {
        setFollowed(false);
        return;
      }

      setIsCheckingFollow(true);
      setFollowError("");
      try {
        const response = await FollowApi.checkUser(targetUsername);
        if (!response.ok) {
          throw new Error(`Unable to check follow status (HTTP ${response.status})`);
        }

        const data = await response.json();
        if (!cancelled) {
          setFollowed(Boolean(data));
        }
      } catch (error) {
        if (!cancelled) {
          setFollowError(error.message || "Unable to check follow status right now.");
        }
      } finally {
        if (!cancelled) {
          setIsCheckingFollow(false);
        }
      }
    };

    fetchFollowStatus();
    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, targetUsername, currentUsername]);

  const followUser = async () => {
    if (!currentUsername) {
      onRequireAuth?.("follow users");
      return;
    }
    setIsSubmittingFollow(true);
    setFollowError("");
    try {
      const response = await FollowApi.addUser(targetUsername);
      if (!response.ok) {
        throw new Error(`Follow failed (HTTP ${response.status})`);
      }
      setFollowed(true);
    } catch (error) {
      setFollowError(error.message || "Unable to follow right now.");
    } finally {
      setIsSubmittingFollow(false);
    }
  };

  const unfollowUser = async () => {
    if (!currentUsername) {
      onRequireAuth?.("follow users");
      return;
    }
    setIsSubmittingFollow(true);
    setFollowError("");
    try {
      const response = await FollowApi.deleteFollow(targetUsername);
      if (!response.ok) {
        throw new Error(`Unfollow failed (HTTP ${response.status})`);
      }
      setFollowed(false);
    } catch (error) {
      setFollowError(error.message || "Unable to unfollow right now.");
    } finally {
      setIsSubmittingFollow(false);
    }
  };

  const accountAge = target?.createdAt
    ? formatDistanceToNow(new Date(target.createdAt), { addSuffix: false })
    : "N/A";

  const followBtnText = isSubmittingFollow
    ? "Processing..."
    : followed
      ? "Following"
      : "Follow";

  const startChat = async () => {
    if (!currentUsername) {
      onRequireAuth?.("send messages");
      return;
    }

    const targetMemberId = target?.id ?? target?.userId;
    if (!targetMemberId) {
      setFollowError("Unable to find target user id for creating a conversation.");
      return;
    }

    setIsCreatingChat(true);
    setFollowError("");
    try {
      const conversation = await api.createConversation({
        name: null,
        isGroup: false,
        memberIds: [targetMemberId],
      });

      const conversationId =
        conversation?.conversationId ?? conversation?.id ?? conversation?.data?.conversationId;

      if (!conversationId) {
        throw new Error("Backend did not return a conversationId.");
      }

      localStorage.setItem("openConversationId", String(conversationId));
      navigate("/messenger");
    } catch (error) {
      console.error("[UserInfoCard] startChat failed", {
        currentUser: user?.username,
        targetUsername: target?.username,
        targetMemberId,
        error,
      });
      setFollowError(error.message || "Unable to start conversation right now.");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handlePickAvatar = () => {
    if (!isUploadingAvatar) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes((file.type || "").toLowerCase())) {
      setFollowError("Only jpg, png, gif, webp are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFollowError("Image size must be 5MB or less.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setCropOpen(true);
  };

  const closeCropModal = () => {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropOpen(false);
    setCropImageSrc("");
  };

  const handleConfirmCrop = async () => {
    if (!cropImageSrc) {
      setFollowError("Please select an image.");
      return;
    }

    setIsUploadingAvatar(true);
    setFollowError("");
    try {
      const croppedFile = await getCroppedAvatarFile(cropImageSrc, zoom, offsetX, offsetY);
      const response = await api.updateMyAvatar(croppedFile);
      const newAvatarUrl = response?.newAvatarUrl || response?.avatarUrl || "";
      if (!newAvatarUrl) {
        throw new Error("Avatar updated but server did not return URL.");
      }

      setLocalAvatarUrl(newAvatarUrl);
      closeCropModal();
    } catch (error) {
      setFollowError(error.message || "Failed to update avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const increaseZoom = () => {
    setZoom((prev) => Math.min(3, Number((prev + 0.1).toFixed(2))));
  };

  const decreaseZoom = () => {
    setZoom((prev) => Math.max(1, Number((prev - 0.1).toFixed(2))));
  };

  return (
    <div className="user-card">
      <AvatarAndName target={displayTarget}></AvatarAndName>

      {isOwnProfile && (
        <div className="avatar-upload-actions">
          <button
            type="button"
            className="action-btn avatar-btn"
            onClick={handlePickAvatar}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? "Uploading..." : "Change avatar"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </div>
      )}

      {/* Buttons */}
      {!isOwnProfile && (
        <div className="user-actions">
          <button
            className={`action-btn follow-btn ${followed ? "following" : ""}`}
            onClick={followed ? unfollowUser : followUser}
            disabled={isCheckingFollow || isSubmittingFollow}
            aria-busy={isSubmittingFollow}
          >
            <svg
              rpl=""
              aria-hidden="true"
              className="button-leading-icon"
              fill="currentColor"
              height="16"
              icon-name="add-circle"
              viewBox="0 0 20 20"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 1a9 9 0 100 18 9 9 0 000-18zm0 16.2a7.2 7.2 0 117.2-7.2 7.208 7.208 0 01-7.2 7.2zm.9-8.1H14v1.8h-3.1V14H9.1v-3.1H6V9.1h3.1V6h1.8v3.1z"></path>
            </svg>
            {followBtnText}
          </button>
          <button
            className="action-btn chat-btn"
            type="button"
            onClick={startChat}
            disabled={isCreatingChat}
            aria-busy={isCreatingChat}
          >
            <svg
              rpl=""
              aria-hidden="true"
              fill="currentColor"
              height="16"
              icon-name="chat"
              viewBox="0 0 20 20"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 1a9 9 0 00-9 9c0 1.947.79 3.58 1.935 4.957L.231 17.661A.784.784 0 00.785 19H10a9 9 0 009-9 9 9 0 00-9-9zm0 16.2H6.162c-.994.004-1.907.053-3.045.144l-.076-.188a36.981 36.981 0 002.328-2.087l-1.05-1.263C3.297 12.576 2.8 11.331 2.8 10c0-3.97 3.23-7.2 7.2-7.2s7.2 3.23 7.2 7.2-3.23 7.2-7.2 7.2zm5.2-7.2a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0zm-4 0a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0zm-4 0a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z"></path>
            </svg>
            {isCreatingChat ? "Opening chat..." : "Message"}
          </button>
        </div>
      )}

      {followError && <div className="follow-error">{followError}</div>}

      {/* Stats */}
      <div className="stats">
        <div className="stat-row">
          <span>Posts</span>
          <strong>{postNumber}</strong>
        </div>
        <div className="stat-row">
          <span>Account Age</span>
          <strong>{accountAge} 🎂</strong>
        </div>

        {isOwnProfile && (
          <>
            <div className="follow-relations-title">Follow relationships</div>
            <div className="follow-relations-actions">
              <button
                type="button"
                className="relation-btn"
                onClick={() => {
                  setRelationsTab("followers");
                  setRelationsOpen(true);
                }}
              >
                Followers
              </button>
              <button
                type="button"
                className="relation-btn"
                onClick={() => {
                  setRelationsTab("following");
                  setRelationsOpen(true);
                }}
              >
                Following
              </button>
              <button
                type="button"
                className="relation-btn"
                onClick={() => {
                  setRelationsTab("friends");
                  setRelationsOpen(true);
                }}
              >
                Friends
              </button>
            </div>
          </>
        )}
      </div>

      <FollowRelationsDialog
        open={relationsOpen}
        onClose={() => setRelationsOpen(false)}
        targetUsername={targetUsername}
        currentUsername={currentUsername}
        initialTab={relationsTab}
        onRequireAuth={onRequireAuth}
      />

      {cropOpen && createPortal(
        <div className="avatar-crop-overlay" onClick={closeCropModal}>
          <div className="avatar-crop-modal" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-crop-title">Crop avatar</div>
            <div className="avatar-crop-subtitle">Adjust zoom and position to choose the best area.</div>

            <div className="avatar-crop-container">
              <div className="avatar-crop-preview">
                <img
                  src={cropImageSrc}
                  alt="Avatar crop preview"
                  style={{
                    transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                  }}
                />
              </div>
            </div>

            <div className="avatar-crop-controls">
              <label htmlFor="avatar-zoom" className="avatar-crop-zoom-label">Zoom</label>
              <button type="button" className="crop-zoom-btn" onClick={decreaseZoom} aria-label="Zoom out">-</button>
              <input
                id="avatar-zoom"
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <button type="button" className="crop-zoom-btn" onClick={increaseZoom} aria-label="Zoom in">+</button>
              <span className="crop-zoom-value">{zoom.toFixed(2)}x</span>
            </div>

            <div className="avatar-crop-controls">
              <label htmlFor="avatar-pan-x" className="avatar-crop-zoom-label">Left/Right</label>
              <input
                id="avatar-pan-x"
                type="range"
                min={-120}
                max={120}
                step={1}
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
              />
            </div>

            <div className="avatar-crop-controls">
              <label htmlFor="avatar-pan-y" className="avatar-crop-zoom-label">Up/Down</label>
              <input
                id="avatar-pan-y"
                type="range"
                min={-120}
                max={120}
                step={1}
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
              />
            </div>

            <div className="avatar-crop-actions">
              <button type="button" className="action-btn" onClick={closeCropModal} disabled={isUploadingAvatar}>
                Cancel
              </button>
              <button type="button" className="action-btn avatar-btn" onClick={handleConfirmCrop} disabled={isUploadingAvatar || !cropImageSrc}>
                {isUploadingAvatar ? "Uploading..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default UserInfoCard;