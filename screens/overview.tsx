import { Ionicons } from '@expo/vector-icons';
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
  Modal,
  TouchableOpacity,
} from 'react-native';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const flatListRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false); // State to control modal visibility
  const [chatHistory, setChatHistory] = useState([]); // State to store the entire chat history

  // Initialize instances with API key
  const openRouterKey = process.env.EXPO_PUBLIC_OPEN_ROUTER_API_KEY;

  const models = {
    ChatGPT: 'openai/gpt-3.5-turbo',
    Claude: 'anthropic/claude-3-haiku',
    Llama: 'meta-llama/llama-3-8b-instruct:nitro',
  };

  const [selectedModel, setSelectedModel] = useState('Llama'); // State to track the selected model

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
      const model = models[selectedModel]; // Get the model based on selectedModel

      // Create a new message object for the user's input
      const newUserMessage = {
        role: 'user',
        content: userInput,
      };

      // Append the new message to the message list
      setMessages((prevMessages) => [...prevMessages, { user: true, content: userInput }]);

      // Clear the text input immediately
      setUserInput('');

      const url = 'https://openrouter.ai/api/v1/chat/completions';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [...chatHistory, newUserMessage], // Include the entire chat history
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text(); // Get the error message from the response body
        throw new Error(`Network response was not ok: ${response.status} - ${errorMessage}`);
      }

      const responseData = await response.json();

      // Create a new message object for the response
      const newResponseMessage = {
        user: false,
        content: responseData.choices[0].message.content.trim(), // Trim leading whitespace
      };

      // Append the response message to the message list
      setMessages((prevMessages) => [...prevMessages, newResponseMessage]);

      // Save messages to AsyncStorage
      saveMessages([...messages, newUserMessage, newResponseMessage]);

      // Update chat history
      setChatHistory([...chatHistory, newUserMessage]);

      // Scroll to the end of the list after the response message is added
      flatListRef.current.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleClearChat = () => {
    // Clear messages from state and AsyncStorage
    setMessages([]);
    AsyncStorage.removeItem('messages');
    // Clear chat history
    setChatHistory([]);
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
        <View style={styles.pickerContainer}>
          <Text style={styles.selectedModel}>{selectedModel}</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.pickerButton}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Model ▼</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          style={styles.flatlist}
          keyExtractor={(item, index) => index.toString()}
        />
        <View style={styles.divider} />
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

      {/* Model selection modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.filterSheetHeader}>
            <Text style={styles.filterSheetTitle}>Models:</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close-circle-outline" size={35} color="black" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {Object.keys(models).map((model) => (
              <TouchableOpacity
                key={model}
                onPress={() => {
                  setSelectedModel(model);
                  setModalVisible(false);
                }}>
                <Text style={styles.modelOption}>{model}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: 30,
    backgroundColor: '#E5E5EA',
  },
  flatlist: { marginHorizontal: 20 },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  selectedModel: {
    fontWeight: 'bold',
    fontSize: 25,
  },
  pickerButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 5,
    borderColor: 'black',
    borderWidth: 0.5,
  },
  modalContainer: {
    position: 'absolute',
    flexDirection: 'column',
    bottom: 0,
    height: '50%',
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 20,
    marginTop: 20,
  },
  filterSheetTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  modalContent: {
    padding: 20,
  },
  modelOption: {
    fontSize: 20,
    paddingVertical: 10,
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
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    paddingHorizontal: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 5,
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
});

export default ChatScreen;
