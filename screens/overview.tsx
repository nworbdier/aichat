import Anthropic from '@anthropic-ai/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import OpenAI from 'openai';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('openai'); // State to track the selected model
  const flatListRef = useRef(null);

  // Initialize instances with API key
  const anthropic = new Anthropic({ apiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY });
  const openai = new OpenAI({ apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY });

  // Function to load messages from AsyncStorage when component mounts
  const loadMessages = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem('messages');
      if (storedMessages !== null) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Function to save messages to AsyncStorage
  const saveMessages = async (messagesToSave) => {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  // Load messages when component mounts
  useEffect(() => {
    loadMessages();
  }, []);

  const handleChat = async () => {
    try {
      let completion;
      let response;
      if (selectedModel === 'openai') {
        // Use selectedModel instead of the model parameter
        completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant!"',
            },
            {
              role: 'user',
              content: userInput,
            },
          ],
        });
      } else if (selectedModel === 'anthropic') {
        // Use selectedModel instead of the model parameter
        if (userInput.trim() !== '') {
          // Check if userInput is not empty or whitespace
          completion = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            temperature: 0,
            system: 'You are a helpful assistant!',
            messages: [
              {
                role: 'user',
                content: userInput,
              },
            ],
          });
        }
      } else if (selectedModel === 'ollama') {
        // Make request to ollama API
        response = await axios.post('http://localhost:11434/api/chat', {
          model: 'llama3',
          messages: [
            {
              role: 'user',
              content: userInput,
            },
          ],
          stream: false,
        });
      }

      const newMessage = {
        user: true,
        content: userInput,
      };

      let responseMessage;
      if (selectedModel === 'ollama') {
        // Use response directly for 'ollama' model
        responseMessage = {
          user: false,
          content: response.data.message.content,
        };
      } else {
        responseMessage = {
          user: false,
          content: completion.choices[0].message.content,
        };
      }

      const updatedMessages = [...messages, newMessage, responseMessage];
      setMessages(updatedMessages);
      setUserInput('');

      // Save messages to AsyncStorage
      saveMessages(updatedMessages);

      // Scroll to the end of the list
      flatListRef.current.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleClearChat = () => {
    // Clear messages from state and AsyncStorage
    setMessages([]);
    AsyncStorage.removeItem('messages');
  };

  const renderItem = ({ item }) => (
    <View
      style={[styles.messageContainer, item.user ? styles.userMessage : styles.responseMessage]}>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={styles.content}>
        <View style={styles.buttonContainer}>
          <Button title="ChatGPT" onPress={() => setSelectedModel('openai')} />
          <Button title="Claude" onPress={() => setSelectedModel('anthropic')} />
          <Button title="Ollama" onPress={() => setSelectedModel('ollama')} />
        </View>
        <Text style={styles.selectedModelHeader}>{selectedModel}</Text>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Type your message here..."
          />
          <Button title="Send" onPress={handleChat} />
          <Button title="Clear" onPress={handleClearChat} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  selectedModelHeader: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  responseMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
  },
  input: {
    flex: 1,
    marginRight: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});

export default ChatScreen;
