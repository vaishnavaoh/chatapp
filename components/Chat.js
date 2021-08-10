import React from 'react';
import { View, Platform, KeyboardAvoidingView } from 'react-native'

//Gifted Chat library
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';

//Firebase collection
const firebase = require('firebase');
require('firebase/firestore');

//Async Storage
import AsyncStorage from '@react-native-async-storage/async-storage';

//NetInfo
import NetInfo from '@react-native-community/netinfo';


export default class Chat extends React.Component {
  constructor(props) {
    super(props);
    const firebaseConfig = {
      apiKey: "AIzaSyBzgzly2-WlVIUxnd9SVwRPx7IwIrXJC28",
      authDomain: "task-5-cf.firebaseapp.com",
      projectId: "task-5-cf",
      storageBucket: "task-5-cf.appspot.com",
      messagingSenderId: "1003503703326",
      appId: "1:1003503703326:web:a5dcf6718276f576f3e50f",
    };
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    };
    this.referenceChatMessages = firebase.firestore().collection("messages");
    this.state = {
      messages: [],
      uid: 0,
      user: {
        _id: "",
        name: "",
        avatar: "",
      },
      isConnected: false,
      backColor: this.props.route.params.backColor
    };
  }

  componentDidMount() {
    let { name } = this.props.route.params;
    this.props.navigation.setOptions({ title: name });
    NetInfo.fetch().then(connection => {
      if (connection.isConnected) {
        this.setState({ isConnected: true });
        console.log('online');
        this.authUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
          if (!user) {
            firebase.auth().signInAnonymously();
          }
          this.setState({
            uid: user.uid,
            user: {
              _id: user.uid,
              name: name,
              avatar: 'https://placeimg.com/140/140/any',
            },
            messages: [],
          });
          this.unsubscribe = this.referenceChatMessages
            .orderBy("createdAt", "desc")
            .onSnapshot(this.onCollectionUpdate);
        });
      } else {
        console.log('offline');
        this.getMessages();
        this.setState({ isConnected: false });
      }
    });

  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  //Loads messages from AsyncStorage
  async getMessages() {
    let messages = '';
    try {
      messages = await AsyncStorage.getItem('messages') || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  //Delete messages from AsyncStorage
  async deleteMessages() {
    try {
      await AsyncStorage.removeItem('messages');
      this.setState({
        messages: []
      })
    } catch (error) {
      console.log(error.message);
    }
  }

  addMessage() {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      _id: message._id,
      createdAt: message.createdAt,
      text: message.text || null,
      user: message.user,
    });
  }

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text || null,
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar,
        },
      });
    });
    this.setState({
      messages,
    })
  }

  onSend(messages = []) {
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }),
      () => {
        this.addMessage();
        this.saveMessages();
      }
    );
  }

  //Saves messages to client-side storage
  async saveMessages() {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(this.state.messages));
    } catch (error) {
      console.log(error.message);
    }
  }

  renderBubble(props) {
    let backColor = this.state.backColor;
    if (backColor === '#090C08' || backColor === '#474056') {
      return (
        <Bubble
          {...props}
          wrapperStyle={{
            right: {
              backgroundColor: '#bcb8b1'
            }
          }}
          textProps={{
            style: { color: 'black' }
          }}
          timeTextStyle={{ right: { color: 'black' } }}
        />
      )
    } else {
      return (
        <Bubble
          {...props}
          wrapperStyle={{
            right: {
              backgroundColor: 'black'
            }
          }}
        />
      )
    }
  }

  // InputToolbar not rendering when user offline
  renderInputToolbar = props => {
    if (this.state.isConnected === false) {
    } else {
      return (
        <InputToolbar
          {...props}
        />
      );
    }
  }


  render() {
    return (
      <View style={{ flex: 1, backgroundColor: this.state.backColor }}>
        <GiftedChat
          renderBubble={this.renderBubble.bind(this)}
          renderInputToolbar={this.renderInputToolbar.bind(this)}
          messages={this.state.messages}
          onSend={messages => this.onSend(messages)}
          user={this.state.user}
        />
        { Platform.OS === 'android' ? <KeyboardAvoidingView behavior="height" /> : null}
      </View>
    )
  }
}