const FeedApi = (function () {
  async function getFeedFrom(api) {
    return await fetch(api, {
      credentials: "include",
    });
  }
  return { getFeedFrom };
})();
const CommentApi = (function () {
  const getFromUser = async function (userId) {
    return await fetch(`/api/comments/user/${userId}`, {
      credentials: "include",
    });
  };
  const getFromPost = async function (postId) {
    return await fetch(`/api/comments/post/${postId}`, {
      credentials: "include",
    });
  };
  const getFromComment = async function (parentCommentId) {
    return await fetch(
      `http://localhost:8080/api/comments/replies/${parentCommentId}`,
      { credentials: "include" },
    );
  };
  const createForPost = async function (replyData) {
    return await fetch("http://localhost:8080/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        content: replyData.content,
        targetInteractableItemID: replyData.postId,
      }),
    });
  };
  const createForComment = async function (replyData) {
    return await fetch("http://localhost:8080/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        content: replyData.content,
        targetInteractableItemID: replyData.postId,
        parentCommentId: replyData.parentCommentId,
      }),
    });
  };
  async function deleteComment(comment) {
    return await fetch(`http://localhost:8080/api/comments/${comment.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  }
  const getFromKeyword = async function (keyword) {
    return await fetch(`/api/comments/search/${keyword}`, {
      method: "GET",
      credentials: "include",
    });
  };
  return {
    getFromUser,
    getFromComment,
    getFromPost,
    createForPost,
    createForComment,
    deleteComment,
    getFromKeyword,
  };
})();
const PostApi = (function () {
  async function getFromId(postId) {
    return await fetch(`/api/posts/${postId}`, {
      method: "GET",
      credentials: "include",
    });
  }
  async function getFromUser(userId) {
    return await fetch(`/api/posts/user/${userId}`, {
      method: "GET",
      credentials: "include",
    });
  }
  async function deletePost(post) {
    return await fetch(`http://localhost:8080/api/posts/${post.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  }
  async function updateOrCreatePost(postId, formData) {
    return await fetch(
      `http://localhost:8080/api/posts${postId ? `/${postId}` : ""}?`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
        // DO NOT set Content-Type header! Let browser set it with correct boundary
      },
    );
  }
  async function getFromKeyword(keyword) {
    return await fetch(`/api/posts/search/${keyword}`, {
      method: "GET",
      credentials: "include",
    });
  }
  return {
    getFromId,
    getFromUser,
    deletePost,
    updateOrCreatePost,
    getFromKeyword,
  };
})();
const ReactionApi = (function () {
  async function fetchReaction(interactableItemId) {
    const url = `http://localhost:8080/api/reactions/stats/${interactableItemId}`;

    const response = await fetch(url, { credentials: "include" });

    if (!response.ok) {
      throw new Error("Failed to fetch reaction stats");
    }

    return await response.json();
  }
  async function createReaction(targetId, reactionType, targetType) {
    const res = await fetch("http://localhost:8080/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        targetId: targetId,
        reactionType: reactionType,
        targetType: targetType,
      }),
    });
    if (!res.ok) {
      // try to include server error message for easier debugging
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch (e) {
        console.log(e);
      }
      console.error(
        `ReactionApi.createReaction failed: HTTP ${res.status}`,
        bodyText,
      );
    }
    return res;
  }
  return { fetchReaction, createReaction };
})();
const FollowApi = (function () {
  const jsonOrNull = async (response) => {
    try {
      return await response.json();
    } catch (e) {
      return null;
    }
  };

  const normalizePagedList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    return [];
  };

  const fetchFromCandidates = async (urls, options = {}) => {
    let lastResponse = null;
    for (const url of urls) {
      const response = await fetch(url, {
        credentials: "include",
        ...options,
      });
      if (response.ok) {
        return response;
      }
      lastResponse = response;
      // Continue trying alternative candidates for typical routing/server issues.
      const shouldTryNext = [404, 405, 500, 502, 503].includes(response.status);
      if (!shouldTryNext) {
        return response;
      }
    }
    return lastResponse;
  };

  const checkUser = async function (username) {
    return await fetch(`/api/follows/${username}`, {
      credentials: "include",
    });
  };
  const addUser = async function (username) {
    return await fetch(`/api/follows/${username}`, {
      method: "POST",
      credentials: "include",
    });
  };
  async function deleteFollow(username) {
    return await fetch(`/api/follows/${username}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  }

  const getFollowers = async function (username, page = 0, size = 30) {
    const response = await fetchFromCandidates([
      `/api/follows/${username}/followers?page=${page}&size=${size}`,
      `/api/follows/followers/${username}?page=${page}&size=${size}`,
      `/api/users/${username}/followers?page=${page}&size=${size}`,
    ]);

    if (!response?.ok) {
      return {
        ok: false,
        status: response?.status || 500,
        data: [],
      };
    }

    const data = await jsonOrNull(response);
    return {
      ok: true,
      status: response.status,
      data: normalizePagedList(data),
    };
  };

  const getFollowing = async function (username, page = 0, size = 30) {
    const response = await fetchFromCandidates([
      `/api/follows/${username}/following?page=${page}&size=${size}`,
      `/api/follows/following/${username}?page=${page}&size=${size}`,
    ]);

    if (!response?.ok) {
      return {
        ok: false,
        status: response?.status || 500,
        data: [],
      };
    }

    const data = await jsonOrNull(response);
    return {
      ok: true,
      status: response.status,
      data: normalizePagedList(data),
    };
  };

  const getFriends = async function (username, page = 0, size = 30) {
    const direct = await fetchFromCandidates([
      `/api/follows/${username}/friends?page=${page}&size=${size}`,
      `/api/follows/friends/${username}?page=${page}&size=${size}`,
      `/api/users/${username}/friends?page=${page}&size=${size}`,
    ]);

    if (direct?.ok) {
      const data = await jsonOrNull(direct);
      const list = normalizePagedList(data);
      if (list.length > 0) {
        return {
          ok: true,
          status: direct.status,
          data: list,
        };
      }
    }

    // Fallback 1: derive from intersection(followers, following)
    const [followers, following] = await Promise.all([
      getFollowers(username, page, size),
      getFollowing(username, page, size),
    ]);

    if (followers.ok && following.ok) {
      const normalizeName = (u) =>
        String(u?.username ?? u?.userName ?? "")
          .trim()
          .toLowerCase();

      const followingMap = new Map(
        following.data
          .map((u) => [normalizeName(u), u])
          .filter(([name]) => Boolean(name)),
      );

      const merged = followers.data
        .map((u) => {
          const key = normalizeName(u);
          const other = followingMap.get(key);
          if (!key || !other) return null;
          return {
            ...(other || {}),
            ...(u || {}),
            mutualFollow: true,
          };
        })
        .filter(Boolean);

      if (merged.length > 0) {
        return {
          ok: true,
          status: 200,
          data: merged,
        };
      }
    }

    // Fallback 2: if following is unreliable, verify follow-back per follower.
    if (followers.ok && followers.data.length > 0) {
      const checks = await Promise.all(
        followers.data.map(async (u) => {
          const uname = u?.username ?? u?.userName;
          if (!uname) return null;
          try {
            const resp = await checkUser(uname);
            if (!resp.ok) return null;
            const iFollowBack = await resp.json();
            if (!iFollowBack) return null;
            return {
              ...u,
              mutualFollow: true,
            };
          } catch (e) {
            return null;
          }
        }),
      );

      const verifiedMutual = checks.filter(Boolean);
      if (verifiedMutual.length > 0) {
        return {
          ok: true,
          status: 200,
          data: verifiedMutual,
        };
      }
    }

    // Fallback 3: last resort from mutual flag in followers response.
    if (followers.ok) {
      const mutual = followers.data.filter((u) =>
        Boolean(u?.mutualFollow ?? u?.isMutualFollow),
      );

      return {
        ok: true,
        status: 200,
        data: mutual,
      };
    }

    if (direct && !direct.ok) {
      return {
        ok: false,
        status: direct.status,
        data: [],
      };
    }

    return {
      ok: false,
      status: followers.status || 500,
      data: [],
    };
  };

  const searchGroupCandidates = async function (keyword) {
    const q = encodeURIComponent(keyword || "");
    // Backend-first contract: ChatController owns group candidate search.
    const response = await fetchFromCandidates([
      `/api/chat/group/candidates?keyword=${q}`,
    ]);

    if (!response?.ok) {
      return {
        ok: false,
        status: response?.status || 500,
        data: [],
      };
    }

    const data = await jsonOrNull(response);
    return {
      ok: true,
      status: response.status,
      data: normalizePagedList(data),
    };
  };

  return {
    checkUser,
    addUser,
    deleteFollow,
    getFollowers,
    getFollowing,
    getFriends,
    searchGroupCandidates,
  };
})();
const UserApi = (function () {
  const getFromKeyword = async function (keyword) {
    return await fetch(`/api/users/search/${keyword}`, {
      credentials: "include",
    });
  };

  const getProfileByUsername = async function (username) {
    return await fetch(`/api/profile/${encodeURIComponent(username)}`, {
      credentials: "include",
    });
  };

  return { getFromKeyword, getProfileByUsername };
})();
export { CommentApi, PostApi, ReactionApi, FeedApi, FollowApi, UserApi };
