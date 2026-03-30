import { useState, useEffect } from "react";
import { ReactionApi } from "../../utils/feedApi";

const reactionStatsCache = new Map();
const reactionStatsInFlight = new Map();
const REACTION_CACHE_TTL_MS = 10_000;

async function fetchReactionStatsWithCache(interactableId) {
  const key = String(interactableId);
  const now = Date.now();
  const cached = reactionStatsCache.get(key);
  if (cached && now - cached.ts < REACTION_CACHE_TTL_MS) {
    return cached.data;
  }

  if (reactionStatsInFlight.has(key)) {
    return reactionStatsInFlight.get(key);
  }

  const request = ReactionApi.fetchReaction(interactableId)
    .then((data) => {
      reactionStatsCache.set(key, { data, ts: Date.now() });
      return data;
    })
    .finally(() => {
      reactionStatsInFlight.delete(key);
    });

  reactionStatsInFlight.set(key, request);
  return request;
}

const Reaction = ({
  userId,
  interactableId,
  entityId,
  targetType,
  isAuthenticated,
  onRequireAuth,
}) => {
  const [loading, setLoading] = useState(false);
  const [reactions, setReactions] = useState([]);
  //'LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'
  const icons = {
    LIKE: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="2.688 1.968 19.248 19.344"
        width="19.248"
        height="19.344"
      >
        <g
          transform="translate(0,0), scale(1)"
          strokeWidth="0"
          id="SVGRepo_bgCarrier"
        />

        <g
          strokeLinejoin="round"
          strokeLinecap="round"
          id="SVGRepo_tracerCarrier"
        />

        <g id="SVGRepo_iconCarrier">
          {" "}
          <path
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2.4"
            stroke="#000000"
            d="M8 10V20M8 10L4 9.99998V20L8 20M8 10L13.1956 3.93847C13.6886 3.3633 14.4642 3.11604 15.1992 3.29977L15.2467 3.31166C16.5885 3.64711 17.1929 5.21057 16.4258 6.36135L14 9.99998H18.5604C19.8225 9.99998 20.7691 11.1546 20.5216 12.3922L19.3216 18.3922C19.1346 19.3271 18.3138 20 17.3604 20L8 20"
          />{" "}
        </g>
      </svg>
    ),
    LOVE: (
      <svg
        fill="#000000"
        viewBox="1 2 22 21"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <path
            className="svg-color"
            d="M20.5,4.609A5.811,5.811,0,0,0,16,2.5a5.75,5.75,0,0,0-4,1.455A5.75,5.75,0,0,0,8,2.5,5.811,5.811,0,0,0,3.5,4.609c-.953,1.156-1.95,3.249-1.289,6.66,1.055,5.447,8.966,9.917,9.3,10.1a1,1,0,0,0,.974,0c.336-.187,8.247-4.657,9.3-10.1C22.45,7.858,21.453,5.765,20.5,4.609Zm-.674,6.28C19.08,14.74,13.658,18.322,12,19.34c-2.336-1.41-7.142-4.95-7.821-8.451-.513-2.646.189-4.183.869-5.007A3.819,3.819,0,0,1,8,4.5a3.493,3.493,0,0,1,3.115,1.469,1.005,1.005,0,0,0,1.76.011A3.489,3.489,0,0,1,16,4.5a3.819,3.819,0,0,1,2.959,1.382C19.637,6.706,20.339,8.243,19.826,10.889Z"
          ></path>
        </g>
      </svg>
    ),
    HAHA: (
      <svg
        fill="#000000"
        viewBox="-8 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <path
            className="svg-color"
            d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm141.4 389.4c-37.8 37.8-88 58.6-141.4 58.6s-103.6-20.8-141.4-58.6S48 309.4 48 256s20.8-103.6 58.6-141.4S194.6 56 248 56s103.6 20.8 141.4 58.6S448 202.6 448 256s-20.8 103.6-58.6 141.4zM343.6 196l33.6-40.3c8.6-10.3-3.8-24.8-15.4-18l-80 48c-7.8 4.7-7.8 15.9 0 20.6l80 48c11.5 6.8 24-7.6 15.4-18L343.6 196zm-209.4 58.3l80-48c7.8-4.7 7.8-15.9 0-20.6l-80-48c-11.6-6.9-24 7.7-15.4 18l33.6 40.3-33.6 40.3c-8.7 10.4 3.8 24.8 15.4 18zM362.4 288H133.6c-8.2 0-14.5 7-13.5 15 7.5 59.2 58.9 105 121.1 105h13.6c62.2 0 113.6-45.8 121.1-105 1-8-5.3-15-13.5-15z"
          ></path>
        </g>
      </svg>
    ),
    WOW: (
      <svg viewBox="1 1 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          {" "}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="#33363F"
            strokeWidth="2"
            strokeLinecap="round"
          ></circle>{" "}
          <circle
            cx="9"
            cy="9"
            r="1.25"
            fill="#33363F"
            stroke="#33363F"
            strokeWidth="0.5"
            strokeLinecap="round"
            className="svg-color"
          ></circle>{" "}
          <circle
            cx="15"
            cy="9"
            r="1.25"
            fill="#33363F"
            stroke="#33363F"
            strokeWidth="0.5"
            strokeLinecap="round"
            className="svg-color"
          ></circle>{" "}
          <path
            d="M15 15.5C15 16.8807 13.6569 18 12 18C10.3431 18 9 16.8807 9 15.5C9 14.1193 10.3431 13 12 13C13.6569 13 15 14.1193 15 15.5Z"
            className="svg-color"
            fill="#33363F"
          ></path>{" "}
        </g>
      </svg>
    ),
    SAD: (
      <svg viewBox="1 1 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          {" "}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="#33363F"
            strokeWidth="2"
            strokeLinecap="round"
          ></circle>{" "}
          <path
            d="M7.88124 16.2441C8.37391 15.8174 9.02309 15.5091 9.72265 15.3072C10.4301 15.103 11.2142 15 12 15C12.7858 15 13.5699 15.103 14.2774 15.3072C14.9769 15.5091 15.6261 15.8174 16.1188 16.2441"
            stroke="#33363F"
            strokeWidth="2"
            strokeLinecap="round"
          ></path>{" "}
          <circle
            cx="9"
            cy="10"
            r="1.25"
            className="svg-color"
            stroke="#33363F"
            strokeWidth="0.5"
            strokeLinecap="round"
          ></circle>{" "}
          <circle
            cx="15"
            cy="10"
            r="1.25"
            className="svg-color"
            stroke="#33363F"
            strokeWidth="0.5"
            strokeLinecap="round"
          ></circle>{" "}
        </g>
      </svg>
    ),
    ANGRY: (
      <svg
        fill="#000000"
        viewBox="-8 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          <path
            className="svg-color"
            d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm0-144c-33.6 0-65.2 14.8-86.8 40.6-8.5 10.2-7.1 25.3 3.1 33.8s25.3 7.2 33.8-3c24.8-29.7 75-29.7 99.8 0 8.1 9.7 23.2 11.9 33.8 3 10.2-8.5 11.5-23.6 3.1-33.8-21.6-25.8-53.2-40.6-86.8-40.6zm-48-72c10.3 0 19.9-6.7 23-17.1 3.8-12.7-3.4-26.1-16.1-29.9l-80-24c-12.8-3.9-26.1 3.4-29.9 16.1-3.8 12.7 3.4 26.1 16.1 29.9l28.2 8.5c-3.1 4.9-5.3 10.4-5.3 16.6 0 17.7 14.3 32 32 32s32-14.4 32-32.1zm199-54.9c-3.8-12.7-17.1-19.9-29.9-16.1l-80 24c-12.7 3.8-19.9 17.2-16.1 29.9 3.1 10.4 12.7 17.1 23 17.1 0 17.7 14.3 32 32 32s32-14.3 32-32c0-6.2-2.2-11.7-5.3-16.6l28.2-8.5c12.7-3.7 19.9-17.1 16.1-29.8z"
          ></path>
        </g>
      </svg>
    ),
  };
  useEffect(() => {
    let cancelled = false;
    if (!interactableId) {
      setReactions([]);
      return;
    }

    fetchReactionStatsWithCache(interactableId)
      .then((data) => {
        if (!cancelled) {
          setReactions(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [interactableId]);

  const applyLocalReaction = (prevReactions, selectedType, action) => {
    const updated = prevReactions.map((r) => ({ ...r }));
    const previousMine = updated.find((r) => r.hasUserReaction);
    let selected = updated.find((r) => r.reactionType === selectedType);

    if (!selected) {
      selected = {
        reactionType: selectedType,
        reactionCount: 0,
        hasUserReaction: false,
      };
      updated.push(selected);
    }

    if (action === "REMOVED") {
      selected.hasUserReaction = false;
      selected.reactionCount = Math.max(0, (selected.reactionCount || 0) - 1);
      return updated;
    }

    if ((action === "ADDED" || action === "UPDATED") && previousMine) {
      if (previousMine.reactionType !== selectedType) {
        previousMine.hasUserReaction = false;
        previousMine.reactionCount = Math.max(
          0,
          (previousMine.reactionCount || 0) - 1,
        );
        selected.reactionCount = (selected.reactionCount || 0) + 1;
      }
      selected.hasUserReaction = true;
      return updated;
    }

    if (action === "ADDED") {
      selected.reactionCount = (selected.reactionCount || 0) + 1;
      selected.hasUserReaction = true;
    } else if (action === "UPDATED") {
      selected.hasUserReaction = true;
    }

    return updated;
  };
  return (
    <div className="reaction-container">
      {Object.entries(icons).map(([name, image]) => (
        <button
          key={name}
          className={`post-reactions highlight-item ${reactions.find((r) => r.reactionType == name)?.hasUserReaction ? "active" : ""}`}
          onClick={async () => {
            if (!isAuthenticated) {
              onRequireAuth?.("thả cảm xúc");
              return;
            }
            if (loading) return;
            setLoading(true);

            try {
              // Determine which ID to send to createReaction: the entity id (post/comment/message)
              // Backend expects the entity id (e.g. post.id or comment.id) so it can resolve the InteractableItem.
              const targetIdToSend = entityId ?? interactableId;
              const response = await ReactionApi.createReaction(
                targetIdToSend,
                name,
                targetType,
              );
              if (response.ok) {
                const result = await response.json();
                const { action } = result;
                setReactions((prevReactions) =>
                  applyLocalReaction(prevReactions, name, action),
                );
              }
            } catch (err) {
              console.error("Error toggling reaction:", err);
            } finally {
              setLoading(false);
            }
          }}
        >
          {image}
          <span>
            {reactions.find((r) => r.reactionType == name)?.reactionCount || 0}
          </span>
        </button>
      ))}
    </div>
  );
};
export default Reaction;
