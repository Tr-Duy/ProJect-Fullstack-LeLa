import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:8080/api/v1/auth/login', {
      usernameOrEmail: 'leaner',
      password: '123456'
    });
    const token = loginRes.data.data.accessToken;
    console.log('Got token');

    const chatRes = await axios.post('http://localhost:8080/api/v1/chat/learner/start', {}, {
      headers: { Authorization: 'Bearer ' + token }
    });
    const conversationId = chatRes.data.data.id;
    console.log('Got conversationId:', conversationId);

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/api/v1/ws'),
      connectHeaders: { Authorization: 'Bearer ' + token },
      onConnect: () => {
        console.log('STOMP Connected!');
        client.subscribe('/topic/conversation/' + conversationId, (msg) => {
          console.log('Received:', msg.body);
        });
        
        client.publish({
          destination: '/app/chat.send',
          body: JSON.stringify({
            conversationId,
            content: 'Hello from script'
          })
        });
        console.log('Message sent!');
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers.message, frame.body);
      },
      onWebSocketError: (evt) => {
        console.error('WS Error');
      }
    });

    client.activate();
    
    setTimeout(() => {
      client.deactivate();
      console.log('Done');
      process.exit(0);
    }, 5000);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

test();
