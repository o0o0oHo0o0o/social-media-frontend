import React, { useEffect, useState } from "react";
import FeedItem from "./FeedItem";
import { PostApi, CommentApi } from "../../utils/feedApi";
import CommentItem from "./CommentItem";
import "../../styles/userPage.css";
import UserInfoCard from "./UserInfoCard";
import AvatarAndName from "./AvatarAndName";

function UserPage({ userInfo, target, openPost, isAuthenticated, onRequireAuth }) {
  const userId = userInfo?.id ?? null;
  const [postList, setPostList] = useState([]);
  const [commentList, setCommentList] = useState([]);
  const [currentPage, setCurrentPage] = useState("post");

  useEffect(() => {
    async function fetchUserData() {
      try {
        if (currentPage == "post") {
          const response = await PostApi.getFromUser(target.username);
          if (!response.ok) throw new Error(`User posts failed (HTTP ${response.status})`);
          const data = await response.json();
          setPostList(Array.isArray(data) ? [...data] : []);
        } else {
          const response = await CommentApi.getFromUser(target.username);
          if (!response.ok) throw new Error(`User comments failed (HTTP ${response.status})`);
          const data = await response.json();
          setCommentList([
            ...((Array.isArray(data) ? data : []).map((comment) => {
              comment.replied = false;
              return comment;
            })),
          ]);
        }
      } catch (error) {
        console.error("Failed to load user page data:", error);
        setPostList([]);
        setCommentList([]);
      }
    }
    fetchUserData();
  }, [target, currentPage]);

  return (
    <div className="content-container user-container">
      <div className="user-page">
        <div className="profile-info">
          <AvatarAndName target={target}></AvatarAndName>
        </div>
        <div className="page-controller">
          <button
            className={currentPage == "post" ? "active" : ""}
            onClick={() => {
              setCurrentPage("post");
            }}
          >
            Post
          </button>
          <button
            className={currentPage == "comment" ? "active" : ""}
            onClick={() => {
              setCurrentPage("comment");
            }}
          >
            Comment
          </button>
        </div>
        {currentPage == "post"
          ? postList.map((post) => (
            <React.Fragment key={post.id}>
              <FeedItem
                userId={userId}
                post={post}
                openPost={openPost}
                isAuthenticated={isAuthenticated}
                onRequireAuth={onRequireAuth}
              />
              <hr />
            </React.Fragment>
          ))
          : commentList.map((comment, index) => (
            <CommentItem
              key={comment.id}
              userId={userId}
              commentIndex={index}
              postId={comment.postId}
              commentList={commentList}
              setCommentList={setCommentList}
              openPost={openPost}
              isAuthenticated={isAuthenticated}
              onRequireAuth={onRequireAuth}
            ></CommentItem>
          ))}
      </div>
      <div className="more-info-bar">
        {
          <UserInfoCard
            user={userInfo}
            target={target}
            postNumber={postList.length}
            onRequireAuth={onRequireAuth}
          ></UserInfoCard>
        }
      </div>
    </div>
  );
}

export default UserPage;
