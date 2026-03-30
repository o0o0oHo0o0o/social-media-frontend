// Modal.js
import React, { useEffect, useState } from "react";
import "../../styles/modal.css";
import { Carousel } from "react-responsive-carousel";
import { PostApi } from "../../utils/feedApi";

function Modal({
  userId,
  postId,
  titleInput,
  textInput,
  medias,
  isOpen,
  onClose,
}) {
  const [imagePreviews, setImagePreviews] = useState(
    medias ? medias.map((media) => media.mediaURL) : [],
  );
  const [title, setTitle] = useState(titleInput ? titleInput : "");
  const [text, setText] = useState(textInput ? textInput : "");
  const [selectedFiles, setSelectedFiles] = useState([]); // actual File objects for upload
  const [selectedFlair, setSelectedFlair] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const MAX_IMAGES = 10;

  useEffect(() => {
    medias && setImagePreviews(medias.map((media) => media.mediaURL));
  }, [medias]);
  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      if (imagePreviews.length + files.length >= MAX_IMAGES) {
        alert(`You can only upload up to ${MAX_IMAGES} images.`);
        return;
      }

      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
        // Save actual file for upload
        setSelectedFiles((prev) => [...prev, file]);
      }
    });

    // Reset input so same file can be selected again if needed
    e.target.value = "";
  };

  const removeImage = (index) => {
    if (!imagePreviews[index].includes("localhost")) {
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index)); // Also update the current slide if needed
    }
    setImagePreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);

      // Also update the current slide if needed
      setCurrentSlide((prevSlide) => {
        if (prevSlide >= newPreviews.length) {
          return Math.max(0, newPreviews.length - 1); // go to last
        }
        if (prevSlide > index) {
          return prevSlide - 1; // shift left if we removed earlier slide
        }
        return prevSlide;
      });

      return newPreviews;
    });
  };

  const handleCancel = () => {
    setTitle("");
    setText("");
    setImagePreviews([]);
    onClose();
  };
  const handlePost = async () => {
    // Basic validation
    if (!title.trim() && !text.trim() && imagePreviews.length === 0) {
      alert("Add some content or an image!");
      return;
    }

    // Validate postTopic is required
    if (!selectedFlair) {
      alert("Please select a flair/topic for your post!");
      return;
    }

    // 1. Prepare the JSON part exactly as your API wants
    const postRequest = {
      content: title.trim() + ". " + text.trim(),
      postTopic: selectedFlair,
      location: "New York", // make dynamic later if you want
    };

    // 2. Create FormData
    const formData = new FormData();

    // // Add the JSON as a string (exactly like your curl -F "postRequest={\"content\":...}")
    // formData.append("postRequest", JSON.stringify(postRequest));// Instead of JSON.stringify → send as Blob with correct type
    const jsonBlob = new Blob([JSON.stringify(postRequest)], {
      type: "application/json",
    });
    formData.append("postRequest", jsonBlob);

    // 3. Add all selected images (your API accepts multiple files in one field)
    // We need the actual File objects, not just base64 previews
    // → We'll store them when user selects files
    selectedFiles.length > 0 &&
      selectedFiles.forEach((file) => {
        formData.append("mediaFile", file); // name must be "mediaFile"
      });

    medias &&
      medias
        .filter((media) => {
          console.log(imagePreviews);
          return !imagePreviews.includes(media.mediaURL);
        })
        .forEach((media) => {
          formData.append("deleteFile", media.id);
        });
    try {
      const response = await PostApi.updateOrCreatePost(postId, formData);

      if (response.ok) {
        const result = await response.json();
        console.log("Posted successfully!", result);
        alert("Posted!");

        // Reset + close modal
        setTitle("");
        setText("");
        setImagePreviews([]);
        setSelectedFiles([]); // important!
        setSelectedFlair(null);
        onClose();
        // Trigger feed refresh
        window.dispatchEvent(new CustomEvent('postCreated'));
      } else {
        const errorText = await response.text();
        console.error("Post failed:", response.status, errorText);
        alert("Failed to post: " + response.status);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error – is your backend running?");
    }
  };
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      <div className="modal-backdrop" onClick={handleBackdropClick} />

      <div className="modal-container">
        <div className="modal-header">
          <h2>Create a post</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <input
            type="text"
            placeholder="Title"
            className="modal-title-input"
            value={title}
            onInput={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="What do you want to talk about?"
            className="modal-textarea"
            value={text}
            rows="6"
            onInput={(e) => setText(e.target.value)}
          />
          {/* ====== FLAIR SELECTOR (NEW!) ====== */}
          <div className="flair-selector" style={{ margin: "12px 0" }}>
            <label>Flair (optional)</label>
            <div>
              {[
                "Health",
                "Discussion",
                "Study",
                "Travel",
                "Food",
                "Entertainment",
              ].map((flair) => {
                const isSelected = selectedFlair === flair;

                return (
                  <button
                    key={flair}
                    onClick={() => setSelectedFlair(isSelected ? null : flair)}
                    className="flair-option"
                    style={{
                      fontWeight: isSelected ? "bold" : "normal",
                    }}
                  >
                    {isSelected && "✓ "} {flair}
                  </button>
                );
              })}
              {selectedFlair && (
                <button
                  className="flair-option-delete"
                  onClick={() => setSelectedFlair(null)}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="upload-media">
            <Carousel
              showArrows={true}
              showThumbs={false}
              showStatus={false}
              selectedItem={currentSlide}
              onChange={setCurrentSlide}
            >
              {imagePreviews.map((media, index) => (
                <div className="image-container image-preview-container">
                  <div
                    className="background-image"
                    style={{ backgroundImage: `url(${media})` }}
                  ></div>
                  <img src={media} alt="" />
                  <button
                    className="remove-image-btn"
                    onClick={() => removeImage(index)}
                  >
                    <svg
                      rpl=""
                      fill="white"
                      height="16"
                      icon-name="delete"
                      viewBox="0 0 20 20"
                      width="16"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {" "}
                      <path d="M15.2 15.7c0 .83-.67 1.5-1.5 1.5H6.3c-.83 0-1.5-.67-1.5-1.5V7.6H3v8.1C3 17.52 4.48 19 6.3 19h7.4c1.82 0 3.3-1.48 3.3-3.3V7.6h-1.8v8.1zM17.5 5.8c.5 0 .9-.4.9-.9S18 4 17.5 4h-3.63c-.15-1.68-1.55-3-3.27-3H9.4C7.68 1 6.28 2.32 6.13 4H2.5c-.5 0-.9.4-.9.9s.4.9.9.9h15zM7.93 4c.14-.68.75-1.2 1.47-1.2h1.2c.72 0 1.33.52 1.47 1.2H7.93z"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </Carousel>

            {/* Image Upload Area */}
            {imagePreviews.length < MAX_IMAGES && (
              <div
                className={`image-upload-area ${imagePreviews.length > 0 && "upload-btn"}`}
              >
                <label className="image-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                  {imagePreviews.length > 0 ? (
                    <div className="upload-placeholder">
                      <svg
                        rpl=""
                        fill="currentColor"
                        height="16"
                        icon-name="gallery"
                        viewBox="0 0 20 20"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path d="M15.7 5H15v-.7C15 2.48 13.52 1 11.7 1H4.3C2.48 1 1 2.48 1 4.3v7.4C1 13.52 2.48 15 4.3 15H5v.7C5 17.52 6.48 19 8.3 19h7.4c1.82 0 3.3-1.48 3.3-3.3V8.3C19 6.48 17.52 5 15.7 5zM4.3 13.2c-.83 0-1.5-.67-1.5-1.5V4.3c0-.83.67-1.5 1.5-1.5h7.4c.83 0 1.5.67 1.5 1.5V5H8.3C6.48 5 5 6.48 5 8.3v4.9h-.7zm2.69 3.22l2.24-2.24c.5-.5 1.31-.5 1.81 0l3.03 3.02H8.3c-.57 0-1.05-.32-1.31-.78zm10.21-.72c0 .56-.32 1.05-.78 1.31l-4.1-4.1a3.09 3.09 0 00-4.36 0L6.8 14.07V8.31c0-.83.67-1.5 1.5-1.5h7.4c.83 0 1.5.67 1.5 1.5v7.39z"></path>
                        <path d="M14 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>{" "}
                      </svg>
                      <p>Add</p>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="#878a8c"
                      >
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                      <p>
                        Drag and drop an image or <span>browse</span>
                      </p>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="modal-post-btn"
            onClick={handlePost}
            disabled={
              !title.trim() && !text.trim() && selectedFiles.length === 0
            }
          >
            Post
          </button>
        </div>
      </div>
    </>
  );
}

export default Modal;
