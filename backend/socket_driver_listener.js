const io = require('socket.io/node_modules/socket.io-client');
const fs = require('fs');

const token = fs.readFileSync('C:/Users/mahes/AppData/Local/Temp/opencode/driver_token.txt', 'utf8').trim();
const log = [];
function emit(s) { console.log(s); log.push(s); }

const socket = io('http://localhost:4000', {
  auth: { token },
  transports: ['websocket'],
});

socket.on('connect', () => emit('[driver-socket] connected as id=' + socket.id));
socket.on('connect_error', (e) => emit('[driver-socket] connect_error: ' + e.message));
socket.on('disconnect', (r) => emit('[driver-socket] disconnected: ' + r));

socket.on('ride_requested', (data) => emit('[driver-socket] >>> RECEIVED ride_requested ' + JSON.stringify(data)));
socket.on('ride_status_update', (d) => emit('[driver-socket] ride_status_update ' + JSON.stringify(d)));

setTimeout(() => {
  emit('[driver-socket] test window done; disconnecting');
  socket.disconnect();
  fs.writeFileSync('C:/Users/mahes/AppData/Local/Temp/opencode/driver_ride_live_test.log', log.join('\n'));
  process.exit(0);
}, 90000);
