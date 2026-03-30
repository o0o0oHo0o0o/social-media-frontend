import { formatDistanceToNow } from "date-fns"; // Import the function to format dates
import ReplyInput from "./ReplyInput.jsx";
import OptionButton from "../Common/OptionButton.jsx";
import Reaction from "./Reaction.jsx";
import { CommentApi, PostApi } from "../../utils/feedApi";
import Comment from "./Comment.jsx";
import { useEffect, useMemo, useState } from "react";
const CommentItem = ({
  userId,
  commentIndex,
  postId,
  commentList,
  setCommentList,
  openUser,
  openPost,
  isAuthenticated,
  onRequireAuth,
}) => {
  const comment = commentList[commentIndex];
  const commentUser = comment?.user || {};
  const commentUsername = commentUser?.username || commentUser?.userName || "unknown";
  const commentDisplayName =
    commentUser?.name || commentUser?.fullName || commentUsername;
  const avatarUrl = useMemo(() => {
    const raw =
      commentUser?.avatarUrl ||
      commentUser?.profilePictureURL ||
      commentUser?.profilePictureUrl ||
      commentUser?.avatar ||
      "";
    return String(raw || "").trim();
  }, [commentUser]);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  const onDelete = async () => {
    try {
      await CommentApi.deleteComment(comment);
    } catch (err) {
      console.log("Something went wrong", err);
    }
  };
  const handleCommentReply = async (replyData) => {
    try {
      const response = await CommentApi.createForComment(replyData);
      const data = await response.json();
      comment.replied = true;
      // setCommentList([...commentList]);
      comment.fetched == true
        ? setCommentList([...commentList, { ...data, showReplies: false }])
        : setCommentList([...commentList]);

      console.log(commentList);
    } catch (err) {
      console.log("Something went wrong", err);
    }
  };
  return (
    <article
      key={comment.id}
      className="comment-item"
      onClick={async () => {
        console.log(comment);
        if (openPost) {
          const response = await PostApi.getFromId(
            comment.targetInteractableItemId,
          );
          const data = await response.json();
          openPost(data);
        }
      }}
    >
      <header className="comment-header user-info">
        <div
          className="user-profile"
          onClick={() => openUser && openUser(comment.user)}
        >
          <div className="comment-avatar">
            {avatarUrl && !avatarFailed ? (
              <img
                src={avatarUrl}
                alt={`${commentDisplayName} avatar`}
                className="comment-avatar-img"
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="comment-avatar-fallback" aria-hidden="true">
                {(commentDisplayName || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="comment-author">{commentDisplayName}</span>
        </div>
        {"•"}
        <span className="card-subtitle">
          {formatDistanceToNow(new Date(comment.createdAt), {
            addSuffix: true,
          })}
        </span>
      </header>
      <div className="comment-body">
        <p className="comment-content">{comment.content}</p>

        <footer className="comment-actions post-footer">
          <Reaction
            userId={userId}
            userReaction={comment.userReaction}
            reactions={comment.reaction}
            interactableId={comment.interactableItemId}
            entityId={comment.id}
            targetType="COMMENT"
            isAuthenticated={isAuthenticated}
            onRequireAuth={onRequireAuth}
          ></Reaction>{" "}
          <ReplyInput
            postId={postId}
            parentCommentId={comment.id}
            onSubmit={handleCommentReply}
            isAuthenticated={isAuthenticated}
            onRequireAuth={onRequireAuth}
          ></ReplyInput>
          <OptionButton onDelete={onDelete} onReport={() => { }}></OptionButton>
        </footer>
        {comment.showReplies ? (
          <>
            <button
              className="close-reply-btn"
              onClick={() => {
                comment.showReplies = false;
                setCommentList([...commentList]);
              }}
            >
              <svg
                rpl=""
                fill="currentColor"
                height="16"
                icon-name="subtract-circle"
                viewBox="0 0 20 20"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                {" "}
                <path d="M10 2.8A7.2 7.2 0 112.8 10 7.208 7.208 0 0110 2.8zM10 1a9 9 0 100 18 9 9 0 000-18zm4 8.1H6v1.8h8V9.1z"></path>{" "}
              </svg>
            </button>
            <Comment
              userId={userId}
              postId={postId}
              parentCommentId={comment.id}
              setCommentList={setCommentList}
              commentList={commentList}
              openUser={openUser}
            ></Comment>
          </>
        ) : (
          comment.replied && (
            <button
              className="comment-replied"
              onClick={() => {
                comment.showReplies = true;
                setCommentList([...commentList]);
              }}
            >
              More replies
            </button>
          )
        )}
      </div>{" "}
    </article>
  );
};

export default CommentItem;
