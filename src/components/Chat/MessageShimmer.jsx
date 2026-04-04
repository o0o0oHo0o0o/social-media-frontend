import React from 'react';

const SHIMMER_ROWS = [
  { id: 1, side: 'other', lines: 2, width: '72%' },
  { id: 2, side: 'me', lines: 3, width: '58%' },
  { id: 3, side: 'other', lines: 2, width: '66%' },
  { id: 4, side: 'me', lines: 2, width: '52%' },
];

function MessageShimmerRow({ side = 'other', lines = 2, width = '70%' }) {
  const isMe = side === 'me';

  return (
    <div className={`message-shimmer-row ${isMe ? 'me' : 'other'}`}>
      {!isMe && <div className="message-shimmer-avatar shimmer" />}

      <div className="message-shimmer-content">
        <div className="message-shimmer-name shimmer" />
        <div className={`message-shimmer-bubble ${isMe ? 'me' : 'other'}`}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={`shimmer shimmer-line ${index === lines - 1 ? 'is-short' : ''}`}
              style={index === lines - 1 ? { width } : undefined}
            />
          ))}
        </div>
      </div>

      {isMe && <div className="message-shimmer-spacer" />}
    </div>
  );
}

export default function MessageShimmer({ count = 4 }) {
  return (
    <div className="message-shimmer-list" aria-busy="true" aria-label="Loading messages">
      {SHIMMER_ROWS.slice(0, count).map((row) => (
        <MessageShimmerRow key={row.id} {...row} />
      ))}
    </div>
  );
}