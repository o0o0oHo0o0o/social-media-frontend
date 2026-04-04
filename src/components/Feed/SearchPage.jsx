import React, { useEffect, useState } from "react";
import FeedItem from "./FeedItem";
import { PostApi, CommentApi, UserApi } from "../../utils/feedApi";
import CommentItem from "./CommentItem";
import "../../styles/searchPage.css";
import AvatarAndName from "./AvatarAndName";

function SearchPage({
  userInfo,
  keyword,
  searchType = "post",
  onSearchTypeChange,
  openPost,
  openUser,
  isAuthenticated,
  onRequireAuth,
}) {
  const userId = userInfo?.id ?? null;
  const [userList, setUserList] = useState([]);
  const [postList, setPostList] = useState([]);
  const [commentList, setCommentList] = useState([]);
  const normalizedInitialType = ["post", "comment", "user"].includes(searchType)
    ? searchType
    : "post";
  const [currentPage, setCurrentPage] = useState(normalizedInitialType);

  useEffect(() => {
    const next = ["post", "comment", "user"].includes(searchType)
      ? searchType
      : "post";
    setCurrentPage(next);
  }, [searchType]);

  const switchType = (nextType) => {
    const normalized = ["post", "comment", "user"].includes(nextType)
      ? nextType
      : "post";
    setCurrentPage(normalized);
    onSearchTypeChange?.(normalized);
  };

  const viewLabel =
    currentPage === "post"
      ? "Post"
      : currentPage === "comment"
        ? "Comment"
        : "User";

  const currentCount =
    currentPage === "post"
      ? postList.length
      : currentPage === "comment"
        ? commentList.length
        : userList.length;

  useEffect(() => {
    async function fetchUserData() {
      try {
        if (currentPage == "post") {
          const response = await PostApi.getFromKeyword(keyword);
          if (!response.ok) throw new Error(`Post search failed (HTTP ${response.status})`);
          const data = await response.json();
          setPostList(Array.isArray(data) ? [...data] : []);
        } else if (currentPage == "comment") {
          const response = await CommentApi.getFromKeyword(keyword);
          if (!response.ok) throw new Error(`Comment search failed (HTTP ${response.status})`);
          const data = await response.json();
          setCommentList([
            ...((Array.isArray(data) ? data : []).map((comment) => {
              comment.replied = false;
              return comment;
            })),
          ]);
        } else {
          const response = await UserApi.getFromKeyword(keyword);
          if (!response.ok) throw new Error(`User search failed (HTTP ${response.status})`);
          const data = await response.json();
          setUserList(Array.isArray(data) ? [...data] : []);
        }
      } catch (error) {
        console.error("Search fetch failed:", error);
        setPostList([]);
        setCommentList([]);
        setUserList([]);
      }
    }
    fetchUserData();
  }, [currentPage, keyword]);

  return (
    <div className="content-container">
      <div className="search-page">
        <div className="page-controller">
          <button
            className={currentPage == "post" ? "active" : ""}
            onClick={() => {
              switchType("post");
            }}
          >
            Post
          </button>
          <button
            className={currentPage == "comment" ? "active" : ""}
            onClick={() => {
              switchType("comment");
            }}
          >
            Comment
          </button>
          <button
            className={currentPage == "user" ? "active" : ""}
            onClick={() => {
              switchType("user");
            }}
          >
            User
          </button>
        </div>

        <div className="search-active-view">
          <span className="search-active-chip">Dang xem: {viewLabel}</span>
          <span className="search-active-keyword">Tu khoa: "{keyword}"</span>
          <span className="search-active-count">{currentCount} ket qua</span>
        </div>

        {currentPage == "post" &&
          postList.map((post) => (
            <React.Fragment key={post.id}>
              <FeedItem
                userId={userId}
                post={post}
                openPost={openPost}
                openUser={openUser}
                isAuthenticated={isAuthenticated}
                onRequireAuth={onRequireAuth}
              />
              <hr />
            </React.Fragment>
          ))}
        {currentPage == "comment" &&
          commentList.map((comment, index) => (
            <CommentItem
              key={comment.id}
              userId={userId}
              commentIndex={index}
              postId={comment.postId}
              commentList={commentList}
              setCommentList={setCommentList}
              openPost={openPost}
              openUser={openUser}
              isAuthenticated={isAuthenticated}
              onRequireAuth={onRequireAuth}
            ></CommentItem>
          ))}
        {currentPage == "user" &&
          userList.map((user) => (
            <AvatarAndName key={user.id || user.username} target={user} openUser={openUser}></AvatarAndName>
          ))}
      </div>
      <div className="more-info-bar"></div>
    </div>
  );
}

export default SearchPage;
