import FeedItem from "./FeedItem";
import Comment from "./Comment.jsx";
import ReplyInput from "./ReplyInput.jsx";
import { CommentApi } from "../../utils/feedApi";
import React, { useState } from "react";
const Post = ({
  userId,
  post,
  openUser,
  openPost,
  goBack,
  otherPosts,
  isAuthenticated,
  onRequireAuth,
}) => {
  const [commentList, setCommentList] = useState([]);
  const handlePostReply = async (replyData) => {
    const response = await CommentApi.createForPost(replyData);
    const data = await response.json();
    setCommentList([
      ...commentList,
      { ...data, showReplies: false, fetched: false },
    ]);
  };
  return (
    <div className="content-container other-posts">
      <div className="post-page">
        <FeedItem
          userId={userId}
          post={post}
          openUser={openUser}
          goBack={goBack}
          isAuthenticated={isAuthenticated}
          onRequireAuth={onRequireAuth}
        ></FeedItem>
        <ReplyInput
          onSubmit={handlePostReply}
          postId={post.interactableItemId}
          isAuthenticated={isAuthenticated}
          onRequireAuth={onRequireAuth}
        />
        <hr />
        <Comment
          userId={userId}
          postId={post.id}
          setCommentList={setCommentList}
          commentList={commentList}
          openUser={openUser}
          isAuthenticated={isAuthenticated}
          onRequireAuth={onRequireAuth}
        ></Comment>
      </div>
      <div className="more-info-bar">
        {otherPosts.map((post) => (
          <React.Fragment key={post.id}>
            <FeedItem
              userId={userId}
              post={post}
              openPost={openPost}
              openUser={openUser}
              small={true}
              isAuthenticated={isAuthenticated}
              onRequireAuth={onRequireAuth}
            />
            <hr />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
export default Post;
