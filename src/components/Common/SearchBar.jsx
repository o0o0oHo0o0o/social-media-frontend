import React, { useState } from "react";
import Modal from "./Modal";
import "../../styles/searchbar.css";
import ProfileButton from "../Feed/ProfileButton";

const Header = ({
  user,
  onCreatePost,
  openUser,
  openSearch,
  onLogout,
  isDark,
  setIsDark,
  onRequireAuth,
  onGoAuth,
}) => {
  const userId = user?.id;
  const isAuthenticated = Boolean(userId);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    openSearch(searchQuery);

    console.log("Search:", searchQuery);
  };

  const handlePostCreated = () => {
    setModalOpen(false);
    // Optionally refresh feed
    if (onCreatePost) onCreatePost();
  };

  return (
    <header className="header">
      {/* Left */}
      <div className="header__left">
        <svg viewBox="0 0 24 24" className="header__icon" aria-label="Home">
          <path d="M9 12c-1.67 0-3.13-.85-4-2.15-.34-.88-.02-1.92.66-2.59.68-.67 1.72-.99 2.66-.66 1.13.32 2.15 1.15 2.47 2.34.2.75.1 1.53-.27 2.06zM18 12c-1.67 0-3.13-.85-4-2.15-.34-.88-.02-1.92.66-2.59.68-.67 1.72-.99 2.66-.66 1.13.32 2.15 1.15 2.47 2.34.2.75.1 1.53-.27 2.06zM12 18c-2.28 0-4.22-1.66-4.93-3.9-.15-.53-.02-1.09.33-1.5.35-.41.92-.65 1.48-.65 1.1 0 2 .9 2.01 2 .01.53.19 1.04.49 1.45.35.48 1.02.73 1.62.48.35-.15.59-.5.59-.9 0-1.1-.9-2-2-2-.55 0-1.07.25-1.43.67-.25.3-.37.68-.3 1.07.29 1.66 1.75 2.73 3.43 2.73 1.37 0 2.56-.78 3.15-1.91.2-.4.12-.88-.21-1.19-.33-.31-.88-.34-1.23-.06-.41.33-.65.91-.65 1.5 0 1.1-.9 2-2 2z" />
        </svg>
        <span className="header__brand">MyApp</span>
      </div>

      {/* Search */}
      <form className="header__search" onSubmit={handleSearch}>
        <button type="submit" className="header__search-button">
          <svg
            rpl=""
            aria-hidden="true"
            fill="currentColor"
            height="16"
            icon-name="search-outline"
            viewBox="0 0 20 20"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            {" "}
            <path d="M18.736 17.464l-3.483-3.483A7.961 7.961 0 0016.999 9 8 8 0 109 17a7.961 7.961 0 004.981-1.746l3.483 3.483a.9.9 0 101.272-1.273zM9 15.2A6.207 6.207 0 012.8 9c0-3.419 2.781-6.2 6.2-6.2s6.2 2.781 6.2 6.2-2.781 6.2-6.2 6.2z"></path>
          </svg>
        </button>
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="header__search-input"
          aria-label="Search"
        />
      </form>

      {/* Right */}
      <div className="header__right">
        <button
          className="header__nav-button create-post-btn"
          onClick={() => {
            if (!isAuthenticated) {
              onRequireAuth?.("tạo bài viết");
              return;
            }
            setModalOpen(true);
          }}
        >
          <svg
            rpl=""
            fill="currentColor"
            height="20"
            viewBox="0 0 20 20"
            width="20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M14.7 2H5.3C3.481 2 2 3.48 2 5.3v9.4C2 16.519 3.48 18 5.3 18h9.4c1.819 0 3.3-1.48 3.3-3.3V5.3C18 3.481 16.52 2 14.7 2zm1.499 12.7a1.5 1.5 0 01-1.499 1.499H5.3A1.5 1.5 0 013.801 14.7V5.3A1.5 1.5 0 015.3 3.801h9.4A1.5 1.5 0 0116.199 5.3v9.4zM14 10.9h-3.1V14H9.1v-3.1H6V9.1h3.1V6h1.8v3.1H14v1.8z"></path>
          </svg>
          Create Post
        </button>
        {isAuthenticated && (
          <Modal userId={userId} isOpen={modalOpen} onClose={handlePostCreated} />
        )}
        {isAuthenticated ? (
          <ProfileButton
            openUser={openUser}
            user={user}
            onLogout={onLogout}
            isDark={isDark}
            setIsDark={setIsDark}
          ></ProfileButton>
        ) : (
          <button
            className="header__nav-button"
            onClick={() => onGoAuth?.()}
          >
            Đăng nhập / Đăng ký
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
