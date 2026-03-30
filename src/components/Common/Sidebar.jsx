import "../../styles/sidebar.css";
const Sidebar = ({ currentView, setCurrentView, onNavigateToMessenger }) => {
  return (
    <div className="sidebar">
      {/* Message Button */}
      <div className="message container" onClick={onNavigateToMessenger}>
        <svg
          fill="currentColor"
          height="20"
          viewBox="0 0 24 24"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z" />
        </svg>
        <span className="text">Messages</span>
      </div>

      <hr className="sidebar-divider" />

      <div
        className={`home container ${currentView == "home" ? "active" : ""}`}
        onClick={() => {
          setCurrentView("home");
        }}
      >
        <svg
          rpl=""
          fill="currentColor"
          height="20"
          icon-name="home"
          viewBox="0 0 20 20"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          {currentView == "home" ? (
            <path d="M17.875 8.525a1.584 1.584 0 00-.35-.52L11.13 1.653a1.602 1.602 0 00-2.264 0L2.47 8.005a1.604 1.604 0 00-.473 1.135v6.374a3.3 3.3 0 003.3 3.3h3.7V12h2v6.814h3.7a3.3 3.3 0 003.3-3.3V9.14c0-.211-.042-.42-.123-.615h.001z"></path>
          ) : (
            <path d="M17.877 8.525a1.584 1.584 0 00-.35-.52l-6.395-6.352a1.602 1.602 0 00-1.13-.467h-.003a1.6 1.6 0 00-1.13.467L2.473 8.005A1.604 1.604 0 002 9.14v6.374a3.3 3.3 0 003.3 3.3h9.4a3.3 3.3 0 003.3-3.3V9.14c0-.211-.042-.42-.123-.615zM16.2 15.514c0 .827-.673 1.5-1.5 1.5H11v-5.575H9v5.575H5.3c-.827 0-1.5-.673-1.5-1.5v-6.29L10 3.066l6.2 6.158v6.29z"></path>
          )}
        </svg>
        <span className="text">Home</span>
      </div>
      <div
        className={`popular container ${currentView == "popular" ? "active" : ""}`}
        onClick={() => {
          setCurrentView("popular");
        }}
      >
        <svg
          rpl=""
          className="rpl-rtl-icon"
          fill="currentColor"
          height="20"
          icon-name="popular"
          viewBox="0 0 20 20"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          {" "}
          {currentView == "popular" ? (
            <path d="M8.477 1.125c-3.78.619-6.808 3.699-7.375 7.487a8.997 8.997 0 001.415 6.391.707.707 0 001.09.119L10.8 7.929H7.03V6.128h5.94a.9.9 0 01.9.9V13h-1.802V9.206L4.88 16.394A.708.708 0 005 17.485c1.781 1.193 4.012 1.767 6.387 1.411 3.787-.568 6.866-3.596 7.484-7.375A9.008 9.008 0 008.477 1.125z"></path>
          ) : (
            <path d="M10 1a9 9 0 00-9 9 9 9 0 009 9 9 9 0 009-9 9 9 0 00-9-9zm0 16.2c-1.66 0-3.186-.57-4.405-1.517l6.476-6.477V13h1.801V7.028a.9.9 0 00-.9-.9h-5.94v1.801h3.771l-6.481 6.482a7.154 7.154 0 01-1.521-4.41c0-3.97 3.23-7.2 7.2-7.2s7.2 3.23 7.2 7.2-3.23 7.2-7.2 7.2L10 17.2z"></path>
          )}{" "}
        </svg>
        <span className="text">Popular</span>
      </div>
      <div
        className={`discussion container ${currentView == "discussion" && "active"}`}
        onClick={() => {
          setCurrentView("discussion");
        }}
      >
        <svg
          rpl=""
          fill="currentColor"
          height="20"
          icon-name="author"
          viewBox="0 0 20 20"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          {currentView == "discussion" ? (
            <path d="M15 10.25c-2.07 0-3.75 1.68-3.75 3.75 0 2.07 1.68 3.75 3.75 3.75 2.07 0 3.75-1.68 3.75-3.75 0-2.07-1.68-3.75-3.75-3.75zM5 10.25c-2.07 0-3.75 1.68-3.75 3.75 0 2.07 1.68 3.75 3.75 3.75 2.07 0 3.75-1.68 3.75-3.75 0-2.07-1.68-3.75-3.75-3.75zM10 2.25C7.93 2.25 6.25 3.93 6.25 6c0 2.07 1.68 3.75 3.75 3.75 2.07 0 3.75-1.68 3.75-3.75 0-2.07-1.68-3.75-3.75-3.75z"></path>
          ) : (
            <path d="M15 12.05c1.08 0 1.95.87 1.95 1.95s-.87 1.95-1.95 1.95-1.95-.87-1.95-1.95.87-1.95 1.95-1.95zm0-1.8c-2.07 0-3.75 1.68-3.75 3.75 0 2.07 1.68 3.75 3.75 3.75 2.07 0 3.75-1.68 3.75-3.75 0-2.07-1.68-3.75-3.75-3.75zM5 12.05c1.08 0 1.95.87 1.95 1.95S6.08 15.95 5 15.95 3.05 15.08 3.05 14s.87-1.95 1.95-1.95zm0-1.8c-2.07 0-3.75 1.68-3.75 3.75 0 2.07 1.68 3.75 3.75 3.75 2.07 0 3.75-1.68 3.75-3.75 0-2.07-1.68-3.75-3.75-3.75zM10 4.05c1.08 0 1.95.87 1.95 1.95S11.08 7.95 10 7.95 8.05 7.08 8.05 6 8.92 4.05 10 4.05zm0-1.8C7.93 2.25 6.25 3.93 6.25 6c0 2.07 1.68 3.75 3.75 3.75 2.07 0 3.75-1.68 3.75-3.75 0-2.07-1.68-3.75-3.75-3.75z"></path>
          )}
        </svg>
        <span className="text">Discussion</span>
      </div>
    </div>
  );
};
export default Sidebar;
