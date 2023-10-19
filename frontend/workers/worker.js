import SocketClass from './SocketClass.js'
import { ACTION_STATUS, ACTIONS } from "./constants.js"

//different from this.worker.onmessage in DedicatedWorkerClass! (they are in different threads)
self.onmessage = (e) => {
    //console.log('Message from main thread', e);
    const data = e.data;
    if(validateEventData(data)) {
        actionSwitcher(data.action, data);
    } else {
        console.log('Invalid message data passed from main thread so taking no action');
    }
}

const validateEventData = (data) => {
  //Validate all the request from main thread if you want to follow strict communication protocols
  //between main thread and the worker thread
  return true;
}

let webSocket = null;

const dataCallback = (data, action, status) => {
    postMessage({
        action,
        data,
        status
    });
}

export const closeWebSocket = () => {
    webSocket && webSocket.close()
}

const actionSwitcher = (action = '', data = {}) => {
    let result = {}
    try {
        switch (action) {
            case ACTIONS.INIT:
                webSocket = new SocketClass(dataCallback);
                webSocket.init();
                result = {
                    action: `${ACTIONS.INIT}`,
                    data: 'WebSocket initialized',
                    status: ACTION_STATUS.SUCCESS
                };
                break;
            case ACTIONS.QUERY:
                webSocket.send(data.query);
                result = {
                    action: `${ACTIONS.QUERY}`,
                    data: 'query sent',
                    status: ACTION_STATUS.SUCCESS
                };
            default:
                break;
        }
    }
    catch (e) {
        result.action = action;
        result.error = e;
        result.status = ACTION_STATUS.FAILURE;
    }
    postMessage(result);
}
