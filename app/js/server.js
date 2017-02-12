"use strict";

// Module to use TCP socket
const net = require('net');
// Module to get server computer name
const COMPUTER_NAME = require('os').hostname();
// Module to use base64
let zlib = require('zlib');
// Module to decode connection data
const crypto = require('crypto');
// Module to emit events to other modules
const EventEmitter = require('events').EventEmitter;
module.exports = new EventEmitter();// Export emitter
// Module to manage config
const nconf = require('nconf');
// Get my ip address and set as server address
const HOST = require('ip').address();
// List of clients allowed to receive data
let connectedClients = [];

const server = net.createServer((client) => {

    // If there is no request from client, disconnect after 1 second
    setTimeout(() => (client.hostname) ? false : client.end(), 4000);// Initialy hostname is undefined

    let addNewClient = (msg) => {
        // Crypto module initialization
        const decipher = crypto.createDecipher('aes-128-ecb', nconf.get('password'));

        // Try to decrypt received message
        try {
            decipher.write(msg.toString(), 'base64');
            decipher.end();
        } catch (err) {
            client.end('UNAUTHORIZED');// and end connection with client
        }

        // Decrypting received message
        var decrypted = '';
        decipher.on('readable', () => {
            var data = decipher.read();
            if (data)
                decrypted += data.toString('utf-8');
        });

        // When received string is decrypted
        decipher.on('end', () => {
            // received data must be JSON format
            try {
                let temp = JSON.parse(decrypted);// Convert received message to JSON
                client.hostname = temp.hostname;// Get client name (eg. Galaxy S etc.)
                client.type = temp.type;// Get client type (0 => smartphone)
                connectedClients.unshift(client);// Add to connected clients array
                module.exports.emit('connectedClients', connectedClients);// Inform all listeners that there is change on client list
                client.write('CONNECTED\n');// Inform client that connection was established
            } catch (err) {
                client.end();// and end connection with client
            }

        });
    };

    client.once('data', addNewClient);// When client sends data (once => remove after first message comes)

    // When client disconnects (code: error/success code)
    client.on('end', errorCode => {
        if(errorCode) client.write(errorCode + "\n");// Sends error code to client
        connectedClients.splice(client);//Remove from connected clients array
        module.exports.emit('connectedClients', connectedClients);// Inform all listeners that there is change on client list
    });

    // Client errors handling
    client.on('error', err => {
        connectedClients.splice(client);//Remove from connected clients array
        module.exports.emit('connectedClients', connectedClients);// Inform all listeners that there is change on client list
    });

});

// On server error
server.on('error', (err) => {
    // If server address is already in use
    if (err.code == 'EADDRINUSE') {
        setTimeout(() => {
            server.close();
            server.listen(nconf.get('port'), HOST);
        }, 1000);
    }
});

/* 'PUBLIC' FUNCTIONS */

// Start server on port from config
module.exports.startServer = () => server.listen(nconf.get('port'), () => {
    //console.log(`${COMPUTER_NAME} is listening on ${HOST}:${nconf.get('port')}`);
});

// Send to al clients message about closing the sever and close it
module.exports.stopServer = () =>{
    for (let i in connectedClients) {
        connectedClients[i].write('SERVERCLOSED\n');//send this message to all connected clients
    }
    server.close();
}

// Restarting server
module.exports.restartServer = () => {
    module.exports.stopServer();
    module.exports.startServer();
};

// This event listener brodcasts code to all connected clients
module.exports.broadcastCode = code =>{
    for (let i in connectedClients) {
        connectedClients[i].write(`${code}\n`);
    }
};

// End connection with given client
module.exports.removeClient = client =>{
    client.end('REMOVEDBYUSER')
};

// This function returns connected clients array.
module.exports.getConnectedClients = callback =>{
    callback(connectedClients);
};

// This function returns server info (then, connection manager generates QRCode with this information)
module.exports.getServerInfo = callback => {
    callback(JSON.parse(`{"name": "${COMPUTER_NAME}", "host": "${HOST}", "port": ${nconf.get('port')}, "password": "${nconf.get('password')}"}`));
};

// Set new server password and save it to file
module.exports.setPassword = newPassword => {
    nconf.set('password', newPassword);
    nconf.save();
};