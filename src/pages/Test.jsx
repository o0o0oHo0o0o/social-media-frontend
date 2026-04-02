import React, { useEffect, useState } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import FeedItem from "../components/Feed/FeedItem";
import { FeedApi } from "../utils/feedApi";
import { CONFIG } from "../config/constants";

const API_BASE = CONFIG.API_BASE_URL || "";
const FeedPage = ({ userId, currentView, openPost }) => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   // Mock response data
  //   const mockFeedData = [
  //     {
  //       id: 1,
  //       username: "john_doe",
  //       postTopic: "Technology",
  //       location: "San Francisco, CA",
  //       content:
  //         "Exciting new developments in AI! Can't wait to see what the future holds.",
  //       medias: [
  //         {
  //           id: 1,
  //           mediaType: "IMAGE",
  //           mediaURL: "https://i.imgur.com/TwwKoyf.jpeg",
  //         },
  //         {
  //           id: 2,
  //           mediaType: "IMAGE",
  //           mediaURL:
  //             "https://i.pinimg.com/originals/53/44/9f/53449fa87702af80374c45b87080c639.jpg",
  //         },
  //       ],
  //       reactionCount: [
  //         ["LIKE", 150],
  //         ["LOVE", 45],
  //         ["WOW", 30],
  //       ],
  //       commentCount: 20,
  //       shareCount: 5,
  //       createdAt: "2025-11-01T12:00:00Z",
  //       updatedAt: "2025-11-02T12:00:00Z",
  //     },
  //     {
  //       id: 2,
  //       username: "jane_smith",
  //       postTopic: "Health",
  //       location: "New York, NY",
  //       content:
  //         "Just completed a 5k! Feeling great and ready for the next challenge.",
  //       medias: [
  //         {
  //           id: 1,
  //           mediaType: "IMAGE",
  //           mediaURL: "https://example.com/images/5k-race.jpg",
  //         },
  //       ],
  //       reactionCount: [
  //         ["LIKE", 250],
  //         ["WOW", 60],
  //       ],
  //       commentCount: 15,
  //       shareCount: 12,
  //       createdAt: "2025-10-28T10:30:00Z",
  //       updatedAt: "2025-11-01T10:30:00Z",
  //     },
  //     {
  //       id: 3,
  //       username: "alex_martin",
  //       postTopic: "Food",
  //       location: "Los Angeles, CA",
  //       content: "Tried the best sushi in town! Highly recommend it.",
  //       medias: [],
  //       reactionCount: [
  //         ["LIKE", 180],
  //         ["LOVE", 40],
  //         ["WOW", 10],
  //       ],
  //       commentCount: 30,
  //       shareCount: 8,
  //       createdAt: "2025-11-03T14:00:00Z",
  //       updatedAt: "2025-11-04T14:00:00Z",
  //     },
  //   ];
  //
  //   // Simulate a network request delay
  //   setTimeout(() => {
  //     setFeed(mockFeedData);
  //     setLoading(false);
  //   }, 1000); // 1 second delay to simulate loading time
  // }, []);

  useEffect(() => {
    const api = (() => {
      const link = `${API_BASE}/api/feed/`;
      switch (currentView) {
        case "home":
          return link + `${userId}`;
        case "popular":
          return link + `popular`;
        case "discussion":
          return link + `discussion`;
      }
    })();
    console.log(api);
    FeedApi.getFeedFrom(api)
      .then((response) => response.json())
      .then((data) => {
        setFeed(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("There was an error fetching the feed data:", error);
        setLoading(false);
      });
  }, [currentView, userId]);
  //
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  return (
    <div className="feed-container">
      {feed.map((post) => (
        <>
          <FeedItem
            key={post.id}
            userId={userId}
            post={post}
            openPost={openPost}
          ></FeedItem>
          <hr />
        </>
      ))}
    </div>
  );
};

export default FeedPage;
