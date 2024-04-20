import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [selectedModel, setSelectedModel] = useState('ChatGPT'); // State to track the selected model
  const flatListRef = useRef(null);

  // Initialize instances with API key
  const openRouterKey = process.env.EXPO_PUBLIC_OPEN_ROUTER_API_KEY;

  const models = {
    ChatGPT: 'openai/gpt-3.5-turbo',
    Claude: 'anthropic/claude-3-haiku',
    Llama: 'meta-llama/llama-3-8b-instruct:nitro',
  };

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
  const saveMessages = async (messagesToSave: { user: boolean; content: any }[]) => {
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
      const model = models[selectedModel]; // Get the model based on selectedModel
      const url = 'https://openrouter.ai/api/v1/chat/completions';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: userInput }],
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text(); // Get the error message from the response body
        throw new Error(`Network response was not ok: ${response.status} - ${errorMessage}`);
      }

      const responseData = await response.json();

      const newMessage = {
        user: true,
        content: userInput,
      };

      const responseMessage = {
        user: false,
        content: responseData.choices[0].message.content.trim(), // Trim leading whitespace
      };

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
          <Button title="ChatGPT" onPress={() => setSelectedModel('ChatGPT')} />
          <Button title="Claude" onPress={() => setSelectedModel('Claude')} />
          <Button title="Llama" onPress={() => setSelectedModel('Llama')} />
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
