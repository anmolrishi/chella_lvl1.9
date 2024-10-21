import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { RetellWebClient } from 'retell-client-js-sdk';
import { motion } from 'framer-motion';
import { Podcast } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const webClient = new RetellWebClient();
const YOUR_API_KEY = 'key_1d2025c27c6328b3f9840255e4df';

const saveCallAnalytics = async (userId: string, callId: string) => {
  try {
    console.log(`Attempting to save analytics for call ID: ${callId}`);

    let analyticsData = null;
    let attempts = 0;
    const maxAttempts = 10;
    const delay = 5000;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempts += 1;

      const apiUrl = `https://api.retellai.com/v2/get-call/${callId}`;
      console.log(`Making API request to: ${apiUrl}, attempt ${attempts}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${YOUR_API_KEY}`,
        },
      });

      console.log(`API response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      analyticsData = await response.json();
      console.log('Received analytics data:', analyticsData);

      if (analyticsData && Object.keys(analyticsData).length > 0) {
        break;
      } else {
        console.log('Analytics data not ready yet, retrying...');
        analyticsData = null;
      }
    }

    if (!analyticsData) {
      console.error('Failed to get analytics data after maximum attempts');
      return;
    }

    console.log('Updating Firestore document for user:', userId);
    const userDocRef = doc(db, 'users', userId);

    const userDoc = await getDoc(userDocRef);
    let analytics = {};

    if (userDoc.exists()) {
      const userData = userDoc.data();
      analytics = userData.analytics || {};
    }

    analytics[callId] = analyticsData;

    await setDoc(userDocRef, { analytics: analytics }, { merge: true });

    console.log('Successfully updated Firestore document with new analytics');
  } catch (error) {
    console.error('Error saving call analytics:', error);
  }
};

export default function SharedDashboard() {
  const { userId } = useParams<{ userId: string }>();
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [agentData, setAgentData] = useState<any>(null);
  const [callStatus, setCallStatus] = useState<'not-started' | 'active' | 'inactive'>('not-started');
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const currentCallIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentCallIdRef.current = currentCallId;
    console.log('Updated currentCallIdRef.current to:', currentCallIdRef.current);
  }, [currentCallId]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRestaurantName(data.restaurantName || '');
          setAgentData(data.agentData || null);
        }
      }
    };

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    const handleConversationStarted = () => {
      console.log('Conversation started');
      setCallStatus('active');
    };

    const handleConversationEnded = ({ code, reason }: { code: any; reason: any }) => {
      console.log('Conversation ended with code:', code, ', reason:', reason);
      console.log('Event handler for conversationEnded is called.');
      setCallStatus('inactive');
      if (userId && currentCallIdRef.current) {
        console.log('Calling saveCallAnalytics with currentCallId:', currentCallIdRef.current);
        saveCallAnalytics(userId, currentCallIdRef.current);
      } else {
        console.log('No currentCallId to save analytics for');
      }
    };

    const handleError = (error: any) => {
      console.error('An error occurred:', error);
      setCallStatus('inactive');
    };

    webClient.on('conversationStarted', handleConversationStarted);
    webClient.on('conversationEnded', handleConversationEnded);
    webClient.on('error', handleError);

    return () => {
      webClient.off('conversationStarted', handleConversationStarted);
      webClient.off('conversationEnded', handleConversationEnded);
      webClient.off('error', handleError);
    };
  }, [userId]);

  const toggleConversation = async () => {
    if (callStatus === 'active') {
      try {
        console.log('Stopping call');
        await webClient.stopCall();
        console.log('Call stopped');
        setCallStatus('inactive');

        if (userId && currentCallIdRef.current) {
          console.log('Calling saveCallAnalytics directly after stopCall with currentCallId:', currentCallIdRef.current);
          saveCallAnalytics(userId, currentCallIdRef.current);
        } else {
          console.log('No currentCallId to save analytics for after stopCall');
        }
      } catch (error) {
        console.error('Error stopping call:', error);
      }
    } else {
      if (!agentData) {
        console.error('Agent not created yet');
        return;
      }

      try {
        const response = await fetch(
          'https://api.retellai.com/v2/create-web-call',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${YOUR_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agent_id: agentData.agent_id,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data from create-web-call:', data);
        setCurrentCallId(data.call_id);
        console.log('Set currentCallId to:', data.call_id);

        await webClient.startCall({
          accessToken: data.access_token,
          callId: data.call_id,
          sampleRate: 16000,
          enableUpdate: true,
        });
        setCallStatus('active');
      } catch (error) {
        console.error('Error starting call:', error);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-blue-50">
      <div className="flex-grow flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-8">
          {restaurantName}'s Virtual Assistant
        </h1>
        <div className="relative cursor-pointer" onClick={toggleConversation}>
          <motion.div
            animate={{
              scale: callStatus === 'active' ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: callStatus === 'active' ? Infinity : 0,
              repeatType: 'reverse',
            }}
          >
            <div
              className={`rounded-full p-16 ${
                callStatus === 'active' ? 'bg-[#92d0ff]' : 'bg-white'
              } shadow-lg ${
                callStatus === 'active'
                  ? 'shadow-[#92d0ff]'
                  : 'shadow-blue-200'
              }`}
            >
              <motion.div
                animate={{
                  rotate: callStatus === 'active' ? [0, 360] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: callStatus === 'active' ? Infinity : 0,
                  ease: 'linear',
                }}
              >
                <Podcast
                  size={110}
                  color={callStatus === 'active' ? 'white' : '#92d0ff'}
                />
              </motion.div>
            </div>
          </motion.div>
          {callStatus === 'active' && (
            <motion.div
              className="absolute -inset-3 rounded-full bg-[#92d0ff] opacity-50"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}