import React, { useState } from "react";
import "../../styles/optionButton.css"; // optional, see CSS at the bottom

function OptionButton({ onEdit, onDelete, onReport }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="post-menu">
      {/* Three-dot button */}
      <button
        className="post-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      >
        ⋮
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="post-menu-dropdown">
          {onEdit && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="post-menu-item"
            >
              Edit
            </button>
          )}

          {onDelete && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="post-menu-item post-menu-delete"
            >
              Delete
            </button>
          )}

          {onReport && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onReport();
                setIsOpen(false);
              }}
              className="post-menu-item"
            >
              Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default OptionButton;
