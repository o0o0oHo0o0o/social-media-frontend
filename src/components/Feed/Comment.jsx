import React, { useEffect, useState } from "react";
import "../../styles/comment.css";
import { CommentApi, PostApi } from "../../utils/feedApi";
import CommentItem from "./CommentItem.jsx";

const Comment = ({
  userId,
  postId,
  parentCommentId,
  commentList,
  setCommentList,
  openUser,
  isAuthenticated,
  onRequireAuth,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let ignore = false;
    const fetchComments = async () => {
      try {
        setLoading(true);
        // Check if there's a parent comment to fetch replies for
        const parentComment =
          parentCommentId &&
          commentList.find((comment) => comment.id == parentCommentId);

        // Condition to check if we need to fetch comments
        const shouldFetch = parentCommentId
          ? parentComment?.fetched === false // If we have a parent comment, fetch if not fetched
          : !commentList.some((comment) => comment.parentcommentId == null); // If no root comment exists, fetch root comments

        console.log(
          "call api comment",
          shouldFetch,
          parentCommentId,
          parentComment?.fetched,
        );
        if (shouldFetch) {
          const response = await (parentCommentId
            ? CommentApi.getFromComment(parentCommentId)
            : CommentApi.getFromPost(postId));
          // const response = await fetch(
          //   postId
          //     ? `http://localhost:8080/api/comments/${postId}?page=0&size=10`
          //     : `http://localhost:8080/api/comments/parent/${parentCommentId}?page=0&size=10`,
          // );

          if (!response.ok) {
            throw new Error("Không tải được bình luận");
          }

          const data = await response.json();
          if (parentComment) {
            parentComment.fetched = true;
          }
          if (!ignore) {
            setCommentList((prevComments) => [
              ...prevComments,

              ...data.map((comment) => {
                comment.fetched = false;
                comment.showReplies = false;
                return comment;
              }),
            ]);
          }
        }
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
    return () => {
      ignore = true;
    };
  }, [parentCommentId, postId, setCommentList]);
  // Require either a postId (top-level comments) or a parentCommentId (replies).
  if (!postId && !parentCommentId) {
    return null;
  }

  if (loading) {
    return <div className="comments-loading">Loading comments...</div>;
  }

  if (error) {
    return <div className="comments-error">Error: {error}</div>;
  }

  if (commentList.length === 0) {
    return (
      <div className="comments-empty">
        Nobody's responded to this post yet. Add your thoughts and get the
        conversation going.{" "}
      </div>
    );
  }

  return (
    <section className="comments-section">
      <div className="comments-list">
        {commentList.map((comment, index) => {
          if (comment.parentCommentId == parentCommentId) {
            return (
              <CommentItem
                key={comment.id}
                userId={userId}
                commentIndex={index}
                postId={postId}
                commentList={commentList}
                setCommentList={setCommentList}
                openUser={openUser}
                isAuthenticated={isAuthenticated}
                onRequireAuth={onRequireAuth}
              ></CommentItem>
            );
          }
        })}
      </div>
    </section>
  );
};

export default Comment;
