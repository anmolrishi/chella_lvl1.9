import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const YOUR_API_KEY = 'key_1d2025c27c6328b3f9840255e4df';

export function generatePrompt(userData: any): string {
  return `You are an AI assistant caller for a restaurant named ${userData.restaurantName}. Your name is ${userData.botName}. You should maintain a ${userData.tone} tone throughout the conversation. Your role is to assist callers with inquiries about the restaurant, take reservations, and provide information about the menu and services.

The details of the restaurant are:

Restaurant Name: ${userData.restaurantName}
Seating Capacity: ${userData.seatingCapacity}
Address: ${userData.address}

Menu:
${userData.menu}

Please use this information to assist callers accurately. If asked about dishes not on the menu or services not provided by the restaurant, politely inform the caller that those options are not available. For reservations, ensure to check the seating capacity before confirming. 

Always be courteous and thank the caller for their interest in the restaurant. Remember to maintain a ${userData.tone} tone throughout the conversation.`;
}

export async function updateLLM(userId: string) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data();
    const generalPrompt = generatePrompt(userData);

    const response = await fetch(
      `https://api.retellai.com/update-retell-llm/${userData.llmData.llm_id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${YOUR_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: userData.model,
          general_prompt: generalPrompt,
          begin_message: userData.beginMessage,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedLLMData = await response.json();

    await updateDoc(userDocRef, {
      llmData: updatedLLMData,
    });

    console.log('LLM updated successfully');
  } catch (error) {
    console.error('Error updating LLM:', error);
    throw error;
  }
}

export async function createLLMAndAgent(restaurantData: any) {
  try {
    const generalPrompt = generatePrompt(restaurantData);

    const llmResponse = await fetch(
      'https://api.retellai.com/create-retell-llm',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${YOUR_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: restaurantData.model,
          general_prompt: generalPrompt,
          begin_message: restaurantData.beginMessage,
        }),
      }
    );

    if (!llmResponse.ok) {
      throw new Error(`HTTP error! status: ${llmResponse.status}`);
    }

    const llmData = await llmResponse.json();

    const agentResponse = await fetch('https://api.retellai.com/create-agent', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${YOUR_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        llm_websocket_url: llmData.llm_websocket_url,
        agent_name: restaurantData.botName,
        voice_id: '11labs-Adrian',
        language: 'en-US',
      }),
    });

    if (!agentResponse.ok) {
      throw new Error(`HTTP error! status: ${agentResponse.status}`);
    }

    const agentData = await agentResponse.json();

    return {
      llmData,
      agentData,
    };
  } catch (error) {
    console.error('Error creating LLM and agent:', error);
    throw error;
  }
}