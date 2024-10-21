import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createLLMAndAgent } from '../utils/llmUtils';
import { Alert, AlertIcon, AlertTitle, CloseButton } from '@chakra-ui/react';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [restaurantName, setRestaurantName] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState('');
  const [address, setAddress] = useState('');
  const [menu, setMenu] = useState<File | null>(null);
  const [botName, setBotName] = useState('');
  const [tone, setTone] = useState('friendly');
  // const [callTransferNumber, setCallTransferNumber] = useState('');
  const [beginMessage, setBeginMessage] = useState('');
  const [model, setModel] = useState('gpt-4o');
  const [alert, setAlert] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserDocument = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            createdAt: new Date(),
          });
        }
      }
    };

    checkUserDocument();
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const menuText = menu ? await menu.text() : '';
      const restaurantData = {
        restaurantName,
        seatingCapacity: parseInt(seatingCapacity),
        address,
        menu: menuText,
        botName,
        tone,
        // callTransferNumber,
        beginMessage,
        model,
      };

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, restaurantData, { merge: true });

      // Create LLM and agent with the restaurant data
      const { llmData, agentData } = await createLLMAndAgent(restaurantData);

      // Update user document with LLM and agent data
      await setDoc(
        userDocRef,
        {
          llmData,
          agentData,
        },
        { merge: true }
      );

      setAlert({
        status: 'success',
        message: 'Onboarding complete. Your restaurant information has been saved successfully.',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setAlert({
        status: 'error',
        message: 'An error occurred while saving your information. Please try again.',
      });
    }
  };

  const renderRestaurantInfoForm = () => (
    <>
      <div>
        <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
          Restaurant Name
        </label>
        <input
          id="restaurantName"
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="seatingCapacity" className="block text-sm font-medium text-gray-700 mb-1">
          Seating Capacity
        </label>
        <input
          id="seatingCapacity"
          type="number"
          value={seatingCapacity}
          onChange={(e) => setSeatingCapacity(e.target.value)}
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="menu" className="block text-sm font-medium text-gray-700 mb-1">
          Menu (txt file)
        </label>
        <input
          id="menu"
          type="file"
          accept=".txt"
          onChange={(e) => setMenu(e.target.files?.[0] || null)}
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </>
  );

  const renderCallerConfigForm = () => (
    <>
      <div>
        <label htmlFor="botName" className="block text-sm font-medium text-gray-700 mb-1">
          Bot Name
        </label>
        <input
          id="botName"
          type="text"
          value={botName}
          onChange={(e) => setBotName(e.target.value)}
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
          Tone
        </label>
        <select
          id="tone"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="friendly">Friendly</option>
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="formal">Formal</option>
        </select>
      </div>
      {/* Call Transfer Number section commented out
      <div>
        <label htmlFor="callTransferNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Call Transfer Number
        </label>
        <input
          id="callTransferNumber"
          type="tel"
          value={callTransferNumber}
          onChange={(e) => setCallTransferNumber(e.target.value)}
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      */}
      <div>
        <label htmlFor="beginMessage" className="block text-sm font-medium text-gray-700 mb-1">
          Begin Message
        </label>
        <textarea
          id="beginMessage"
          value={beginMessage}
          onChange={(e) => setBeginMessage(e.target.value)}
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
          Model
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o-Mini</option>
          <option value="claude-3.5-sonnet">Claude-3.5-Sonnet</option>
          <option value="claude-3-haiku">Claude-3-Haiku</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {step === 1 ? 'Restaurant Information' : 'Caller Configuration'}
      </h2>
      {/* Alert component commented out
      {alert && (
        <Alert status={alert.status} mb={4} fontSize="sm">
          <AlertIcon />
          <AlertTitle mr={2}>{alert.message}</AlertTitle>
          <CloseButton position="absolute" right="8px" top="8px" onClick={() => setAlert(null)} />
        </Alert>
      )}
      */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {step === 1 ? renderRestaurantInfoForm() : renderCallerConfigForm()}
        <div className="flex justify-between">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back
            </button>
          )}
          {step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save and Continue
            </button>
          )}
        </div>
      </form>
    </div>
  );
}