import React from 'react';
import ChatComposer from '../../components/Chat/ChatComposer';

export default function MessengerComposer(props) {
  // Thin wrapper to keep composition consistent while migrating
  return <ChatComposer {...props} />;
}
