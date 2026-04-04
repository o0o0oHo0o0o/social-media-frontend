import React from 'react';

const shimmerCards = [
  { id: 1, lines: 4 },
  { id: 2, lines: 3 },
  { id: 3, lines: 5 },
];

function FeedShimmerCard({ lines = 4 }) {
  return (
    <div className="feed-shimmer-card">
      <div className="feed-shimmer-header">
        <div className="shimmer shimmer-avatar" />
        <div className="feed-shimmer-header-text">
          <div className="shimmer shimmer-line shimmer-line-lg" />
          <div className="shimmer shimmer-line shimmer-line-sm" />
        </div>
        <div className="shimmer shimmer-pill" />
      </div>

      <div className="feed-shimmer-body">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`shimmer shimmer-line ${index === lines - 1 ? 'shimmer-line-short' : ''}`}
          />
        ))}
      </div>

      <div className="shimmer shimmer-media" />

      <div className="feed-shimmer-actions">
        <div className="shimmer shimmer-chip" />
        <div className="shimmer shimmer-chip" />
        <div className="shimmer shimmer-chip" />
      </div>
    </div>
  );
}

export default function FeedShimmer({ count = 3 }) {
  return (
    <div className="feed-shimmer-list" aria-busy="true" aria-label="Loading feed">
      {shimmerCards.slice(0, count).map((card) => (
        <FeedShimmerCard key={card.id} lines={card.lines} />
      ))}
    </div>
  );
}