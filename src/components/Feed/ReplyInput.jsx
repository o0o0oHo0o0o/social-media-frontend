import React, { useState } from "react";
import "../../styles/replyInput.css"; // we'll give you the CSS below

const AddReply = ({
  onSubmit,
  placeholder = "Add a reply...",
  postId,
  parentCommentId,
  isAuthenticated,
  onRequireAuth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      onRequireAuth?.("bình luận");
      return;
    }
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit({
        content: text,
        postId: postId, // or postId if top-level
        parentCommentId: parentCommentId,
      });

      setText("");
      setIsOpen(false); // collapse after success
    } catch (err) {
      alert("Failed to post reply", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setText("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return parentCommentId ? (
      <button
        className="action-reply highlight-item"
        onClick={() => {
          if (!isAuthenticated) {
            onRequireAuth?.("bình luận");
            return;
          }
          setIsOpen(true);
        }}
      >
        Reply
      </button>
    ) : (
      <div
        className="add-reply-trigger"
        onClick={() => {
          if (!isAuthenticated) {
            onRequireAuth?.("bình luận");
            return;
          }
          setIsOpen(true);
        }}
      >
        Add your reply
      </div>
    );
  }

  return (
    <div className="add-reply-box">
      <textarea
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        rows={3}
        className="reply-textarea"
      />

      <div className="reply-actions">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="reply-btn post-btn"
        >
          {isLoading ? "Posting..." : "Post Reply"}
        </button>

        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="reply-btn cancel-btn"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddReply;
