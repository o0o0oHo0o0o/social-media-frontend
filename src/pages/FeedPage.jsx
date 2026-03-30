import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import FeedItem from "../components/Feed/FeedItem";
import Post from "../components/Feed/Post";
import Sidebar from "../components/Common/Sidebar";
import SearchBar from "../components/Common/SearchBar";
import { FeedApi } from "../utils/feedApi";
import "../styles/feed.css";
import UserPage from "../components/Feed/UserPage";
import UserInfoCard from "../components/Feed/UserInfoCard";
import SearchPage from "../components/Feed/SearchPage";
import { PostApi, UserApi } from "../utils/feedApi";

const normalizeUser = (user, fallbackUsername = "") => {
  const username =
    user?.username || user?.userName || String(fallbackUsername || "").trim();

  return {
    ...(user || {}),
    username,
    userName: username,
    fullName: user?.fullName || user?.name || username,
    name: user?.name || user?.fullName || username,
    avatarUrl:
      user?.avatarUrl ||
      user?.profilePictureURL ||
      user?.profilePictureUrl ||
      user?.avatar ||
      "",
    createdAt: user?.createdAt || user?.createdLocalDateTime || null,
  };
};

const normalizePost = (post) => ({
  ...(post || {}),
  user: normalizeUser(post?.user),
  medias: Array.isArray(post?.medias) ? post.medias : [],
  reactionCount: post?.reactionCount || post?.reactionCounts || {},
});

const FeedPage = ({
  userInfo,
  isDark,
  setIsDark,
  onNavigateToMessenger,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userId = userInfo?.id ?? null;
  const isAuthenticated = Boolean(userId);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Derive active tab/detail from URL:
  // /feed/:tab
  // /feed/:tab/post/:postId
  // /feed/:tab/user/:username
  // /feed/:tab/search/:keyword
  const FEED_TABS = ['home', 'popular', 'discussion'];
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isProfileRoute = pathParts[0] === "profile" && Boolean(pathParts[1]);
  const pathSegment = pathParts[1];
  const urlTab = FEED_TABS.includes(pathSegment) ? pathSegment : 'popular';
  const detailType = pathParts[2] || null;
  const detailValue = pathParts[3] ? decodeURIComponent(pathParts[3]) : "";
  const searchParams = new URLSearchParams(location.search);
  const searchTypeParam = String(searchParams.get("type") || "").toLowerCase();
  const routeSearchType = ["post", "comment", "user"].includes(searchTypeParam)
    ? searchTypeParam
    : "post";

  const isPostRoute = detailType === "post";
  const isUserRoute = detailType === "user";
  const isSearchRoute = detailType === "search";
  const routePostId = isPostRoute ? Number(detailValue) : null;
  const routeUsername = isProfileRoute
    ? decodeURIComponent(pathParts[1])
    : isUserRoute
      ? detailValue
      : "";
  const routeKeyword = isSearchRoute ? detailValue : "";

  const currentView =
    isPostRoute ? "post" : (isUserRoute || isProfileRoute) ? "user" : isSearchRoute ? "search" : urlTab;

  // Tabs are URL-driven.
  const setCurrentView = (view) => {
    if (FEED_TABS.includes(view)) {
      navigate(`/feed/${view}`);
    }
  };

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const response = await FeedApi.getFeedFrom(`http://localhost:8080/api/feed/${urlTab}`);
      const data = await response.json();
      setFeed(Array.isArray(data) ? data.map(normalizePost) : []);
    } catch (error) {
      console.error("There was an error fetching the feed data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [urlTab, userId, refreshKey]);

  useEffect(() => {
    const handlePostCreated = () => fetchFeed();
    window.addEventListener("postCreated", handlePostCreated);
    return () => window.removeEventListener("postCreated", handlePostCreated);
  }, [urlTab, userId]);

  useEffect(() => {
    let cancelled = false;

    const loadPostByRoute = async () => {
      if (!isPostRoute || !Number.isFinite(routePostId)) {
        setSelectedPost(null);
        return;
      }

      const fromState = location.state?.post;
      if (fromState && Number(fromState?.id) === Number(routePostId)) {
        setSelectedPost(normalizePost(fromState));
        return;
      }

      setDetailLoading(true);
      try {
        const response = await PostApi.getFromId(routePostId);
        if (!response.ok) throw new Error(`Post load failed (HTTP ${response.status})`);
        const data = await response.json();
        if (!cancelled) {
          setSelectedPost(data ? normalizePost(data) : null);
        }
      } catch (error) {
        console.error("Failed to load post by route:", error);
        if (!cancelled) {
          setSelectedPost(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    loadPostByRoute();
    return () => {
      cancelled = true;
    };
  }, [isPostRoute, routePostId, location.state]);

  useEffect(() => {
    let cancelled = false;

    const loadUserByRoute = async () => {
      const isAnyUserRoute = isUserRoute || isProfileRoute;
      if (!isAnyUserRoute || !routeUsername) {
        setSelectedUser(null);
        setDetailLoading(false);
        return;
      }

      const fromState = location.state?.user;
      const fromStateUsername = fromState?.username || fromState?.userName;
      if (
        fromState &&
        fromStateUsername &&
        String(fromStateUsername).toLowerCase() === String(routeUsername).toLowerCase()
      ) {
        setSelectedUser(normalizeUser(fromState, routeUsername));
      }

      setDetailLoading(true);
      try {
        let resolvedUser = null;

        const profileResponse = await UserApi.getProfileByUsername(routeUsername);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          resolvedUser = normalizeUser(profileData, routeUsername);
        } else {
          const response = await UserApi.getFromKeyword(routeUsername);
          if (!response.ok) throw new Error(`User load failed (HTTP ${response.status})`);
          const data = await response.json();
          const list = Array.isArray(data) ? data : [];
          const exact = list.find(
            (u) =>
              String(u?.username || u?.userName || "").toLowerCase() ===
              String(routeUsername).toLowerCase(),
          );
          resolvedUser = normalizeUser(exact, routeUsername);
        }

        if (!cancelled) {
          setSelectedUser(resolvedUser);
        }
      } catch (error) {
        console.error("Failed to load user by route:", error);
        if (!cancelled) {
          setSelectedUser(normalizeUser(null, routeUsername));
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    loadUserByRoute();
    return () => {
      cancelled = true;
    };
  }, [isUserRoute, isProfileRoute, routeUsername, location.state]);

  const handleCreatePost = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openPost = (post) => {
    if (!post?.id) return;
    navigate(`/feed/${urlTab}/post/${post.id}`, { state: { post } });
    window.scrollTo(0, 0);
  };

  const openUser = (user) => {
    const username = user?.username || user?.userName;
    if (!username) return;
    navigate(`/profile/${encodeURIComponent(username)}`, {
      state: { user },
    });
    window.scrollTo(0, 0);
  };

  const openSearch = (kw) => {
    const nextKeyword = String(kw || "").trim();
    if (!nextKeyword) {
      navigate(`/feed/${urlTab}`);
      return;
    }
    navigate(`/feed/${urlTab}/search/${encodeURIComponent(nextKeyword)}?type=${routeSearchType}`);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    navigate(`/feed/${urlTab}`);
  };

  const requireAuthFor = (featureName = "chức năng này") => {
    const accepted = window.confirm(
      `Bạn cần đăng nhập để ${featureName}. Bạn có muốn chuyển đến trang đăng nhập/đăng ký không?`,
    );
    if (accepted) {
      navigate("/auth");
    }
    return accepted;
  };

  return (
    <div className={`app grid ${isDark ? "dark" : "light"}`}>
      <SearchBar
        user={userInfo}
        onCreatePost={handleCreatePost}
        openUser={openUser}
        openSearch={openSearch}
        onLogout={onLogout}
        isDark={isDark}
        setIsDark={setIsDark}
        onRequireAuth={requireAuthFor}
      />
      <Sidebar
        isDark={isDark}
        setIsDark={setIsDark}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onNavigateToMessenger={() => {
          if (!isAuthenticated) {
            requireAuthFor("nhắn tin");
            return;
          }
          onNavigateToMessenger();
        }}
        onLogout={onLogout}
      />
      {currentView == "post" ? (
        detailLoading || !selectedPost ? (
          <div className="loading">Loading post...</div>
        ) : (
          <Post
            userId={userId}
            post={selectedPost}
            openUser={openUser}
            openPost={openPost}
            goBack={goBack}
            otherPosts={feed.filter((post) => selectedPost != post)}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuthFor}
          />
        )
      ) : currentView == "user" ? (
        detailLoading || !selectedUser ? (
          <div className="loading">Loading profile...</div>
        ) : (
          <UserPage
            userInfo={userInfo}
            target={selectedUser}
            openPost={openPost}
            isAuthenticated={isAuthenticated}
            onRequireAuth={requireAuthFor}
          ></UserPage>
        )
      ) : loading ? (
        <div className="loading">Loading...</div>
      ) : currentView == "search" ? (
        <SearchPage
          userInfo={userInfo}
          keyword={routeKeyword}
          searchType={routeSearchType}
          onSearchTypeChange={(nextType) => {
            const normalized = ["post", "comment", "user"].includes(nextType)
              ? nextType
              : "post";
            navigate(
              `/feed/${urlTab}/search/${encodeURIComponent(routeKeyword)}?type=${normalized}`,
            );
          }}
          openPost={openPost}
          openUser={openUser}
          isAuthenticated={isAuthenticated}
          onRequireAuth={requireAuthFor}
        ></SearchPage>
      ) : (
        <div className="content-container">
          <div className="feed-container">
            {feed.map((post) => (
              <React.Fragment key={post.id}>
                <FeedItem
                  userId={userId}
                  post={post}
                  openPost={openPost}
                  openUser={openUser}
                  isAuthenticated={isAuthenticated}
                  onRequireAuth={requireAuthFor}
                />
                <hr />
              </React.Fragment>
            ))}
          </div>
          <div className="more-info-bar"></div>
        </div>
      )}
    </div>
  );
};

export default FeedPage;
