import React from 'react';
import MessageList from '../../components/Chat/MessageList';

export default function MessengerMessages({
  msgContainerRef,
  onMessagesScroll,
  messages,
  me,
  activeConv,
  typingUsers,
  msgLoading,
  setSelectedUser,
  setUserInfoOpen,
  onImagePreview,
  readReceipts,
  conversationRecipient
  , onReplyClick
}) {
  return (
    <section className="chat-messages" ref={msgContainerRef} onScroll={onMessagesScroll}>
      <MessageList
        messages={messages}
        me={me}
        activeConv={activeConv}
        typingUsers={typingUsers}
        msgLoading={msgLoading}
        onAvatarClick={(user) => { setSelectedUser(user); setUserInfoOpen(true); }}
        onImagePreview={onImagePreview}
        readReceipts={readReceipts}
        recipientOverride={conversationRecipient}
        onReplyClick={onReplyClick}
      />
    </section>
  );
}
