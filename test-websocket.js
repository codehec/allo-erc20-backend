const { io } = require('socket.io-client');

// Connect to your WebSocket server
const socket = io('http://localhost:3000/blockchain-events');

console.log('Connecting to WebSocket server...');

// Connection event
socket.on('connect', () => {
  console.log('✅ Connected to blockchain events WebSocket');
  console.log('Client ID:', socket.id);
  
  // Subscribe to all events
  console.log('\n📡 Subscribing to all events...');
  socket.emit('subscribe', {});
  
  // Get current subscriptions
  console.log('📋 Getting current subscriptions...');
  socket.emit('getSubscriptions');
});

// Listen for blockchain events
socket.on('blockchain-event', (event) => {
  console.log('\n🔔 Received blockchain event:');
  console.log(JSON.stringify(event, null, 2));
});

// Listen for subscription confirmations
socket.on('subscribed', (data) => {
  console.log('✅ Subscription confirmed:', data);
});

// Listen for subscription list
socket.on('subscriptions', (data) => {
  console.log('📋 Current subscriptions:', data.subscriptions);
});

// Listen for errors
socket.on('error', (error) => {
  console.error('❌ Error:', error);
});

// Listen for disconnection
socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Disconnecting...');
  socket.disconnect();
  process.exit(0);
});

console.log('Press Ctrl+C to disconnect'); 