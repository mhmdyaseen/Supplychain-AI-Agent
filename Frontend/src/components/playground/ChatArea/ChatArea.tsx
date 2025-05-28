'use client'

import React, { useEffect } from 'react';
import ChatInput from './ChatInput';
import MessageArea from './MessageArea';
import { usePlaygroundStore } from '@/store';

const ChatArea = () => {
  const { setMessages, currentSessionId } = usePlaygroundStore(); 

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn('No token found, redirecting to login or handling.');
        return;
      }

      if (!currentSessionId) { // Only fetch if a session is selected
        setMessages([]); 
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/chats/${currentSessionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          setMessages([]); // Clear messages on error
          return;
        }

        const data = await response.json();
        setMessages(data); // Set the messages from the fetched data
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]); // Clear messages on network error
      }
    };

    fetchMessages();
  }, [setMessages, currentSessionId]); // Re-run if currentSessionId changes

  return (
    <main className="relative m-1.5 flex flex-grow flex-col rounded-xl">
      <MessageArea />
      <div className="sticky bottom-0 ml-9 px-4 pb-2">
        <ChatInput />
      </div>
    </main>
  );
};

export default ChatArea;