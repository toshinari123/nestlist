import { ACTION_STATUS, ACTIONS } from "./constants.js"

//there is a reverse proxy from 8004 to 8002
//const DEFAULT_WSS_URL = 'wss://nestspace.net:8004'
const DEFAULT_WSS_URL = 'wss://localhost:8002'
class SocketClass {
    constructor(dataCallback, socketURL = null) {
        this.defaultURL = socketURL || DEFAULT_WSS_URL;
        this.webSocket = null;
        this.dataCallback = dataCallback;
    }

    init () {
        this.webSocket = new WebSocket(this.defaultURL);
        this.webSocket.onclose = this.onClose;
        this.webSocket.onerror = this.onError;
        this.webSocket.onmessage = (e) => this.onMessage(e);
        this.webSocket.onopen = () => this.onOpen();
        return this;
    }

    onClose () {
        console.log('WebSocket closed successfully');
    }

    onError (e) {
        console.log('WebSocket has faced the following error', e);
    }

    onMessage (e) {
        const data = this.transformer(e);
        if(data) {
            this.dataCallback(data, ACTIONS.DATA_RECEIVED, ACTION_STATUS.SUCCESS);
        }
    }

    onOpen () {
        console.log('WebSocket opened successfully.');
        //authorization?
        this.dataCallback(null, ACTIONS.WEB_SOCKET_ONOPEN, ACTION_STATUS.SUCCESS);
    }

    send (data) {
        this.webSocket.send(data);
    }

    close () {
        this.webSocket.close();
    }
    
    transformer(messageEvent) {
        const data = messageEvent.data;
        if(!data.event) {
            return data;
        }
        return null
    }
}
export default SocketClass
