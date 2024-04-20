import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
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
  const navigation = useNavigation();
  const [isSendingDisabled, setIsSendingDisabled] = useState(true); // State to track if sending message is disabled
  const [isClearingDisabled, setIsClearingDisabled] = useState(true); // State to track if clearing chat is disabled

  // Initialize instances with API key
  const openRouterKey = process.env.EXPO_PUBLIC_OPEN_ROUTER_API_KEY;

  const models = {
    'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
    'claude-3-haiku': 'anthropic/claude-3-haiku',
    'llama-3-8b-instruct': 'meta-llama/llama-3-8b-instruct:nitro',
    'codellama-34b-instruct': 'meta-llama/codellama-34b-instruct',
  };

  const [selectedModel, setSelectedModel] = useState('llama-3-8b-instruct'); // State to track the selected model

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
    // Check if userInput is empty
    if (!userInput.trim()) {
      return; // Exit function if userInput is empty or contains only whitespace
    }

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
    // Check if there are no messages to clear
    if (messages.length === 0) {
      return; // Exit function if there are no messages
    }

    // Clear messages from state and AsyncStorage
    setMessages([]);
    AsyncStorage.removeItem('messages');
    // Clear chat history
    setChatHistory([]);
  };

  const handleInputChange = (text) => {
    setUserInput(text); // Update the userInput state
    // Enable or disable sending based on whether text is empty or not
    setIsSendingDisabled(text.trim() === '');
  };

  const renderItem = ({ item }) => (
    <View style={{ flexDirection: 'column' }}>
      <View
        style={[
          styles.messageContainer,
          item.user ? styles.userMessageContainer : styles.responseMessageContainer,
        ]}>
        <Text style={[item.user ? styles.userText : styles.responseText]}>{item.content}</Text>
      </View>
      <View style={styles.indicatorContainer}>
        {item.user && <Text style={styles.userIndicator}>You</Text>}
        {!item.user && <Text style={styles.modelIndicator}>{selectedModel}</Text>}
      </View>
    </View>
  );

  // Disable clearing chat if there are no messages
  useEffect(() => {
    setIsClearingDisabled(messages.length === 0);
  }, [messages]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={styles.content}>
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Details', { name: 'Reid' })}
            style={styles.settingsButton}>
            <Ionicons name="cog-outline" size={30} color="black" />
          </TouchableOpacity>
          <Text style={styles.selectedModel}>{selectedModel}</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.pickerButton}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>▼</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          showsVerticalScrollIndicator={false}
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          style={styles.flatlist}
          keyExtractor={(item, index) => index.toString()}
        />
        <View style={styles.divider} />
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handleClearChat} disabled={isClearingDisabled}>
            <Feather name="trash-2" size={25} color={isClearingDisabled ? 'gray' : 'black'} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={userInput}
            onChangeText={handleInputChange}
            placeholder="Type your message here..."
          />
          <TouchableOpacity onPress={handleChat} disabled={isSendingDisabled}>
            <Feather name="send" size={25} color={isSendingDisabled ? 'gray' : 'black'} />
          </TouchableOpacity>
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
  flatlist: {
    marginHorizontal: 20,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 25,
  },
  settingsButton: {
    paddingVertical: 8,
    backgroundColor: '#E5E5EA',
  },
  selectedModel: {
    fontSize: 20,
  },
  pickerButton: {
    width: 30,
    alignItems: 'center',
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
    height: '60%',
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
  userIndicator: {
    alignSelf: 'flex-end',
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 12,
  },
  modelIndicator: {
    alignSelf: 'flex-start',
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 12,
  },
  indicatorContainer: {
    paddingHorizontal: 5,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#1F8AFF',
  },
  userText: {
    fontSize: 16,
    color: 'white',
  },
  responseMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
  },
  responseText: {
    fontSize: 16,
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    paddingHorizontal: 25,
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
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
});

export default ChatScreen;
