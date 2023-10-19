//Main thread
class DedicatedWorkerClass {
    constructor(onMessageCtxNFunc = null, onErrorCtxNFunc = null) {
        if(!!window.Worker) {
            this.worker = new Worker('/workers/worker.js', { type : "module" });
            this.worker.onerror = (e) => this.onError(e);
            this.worker.onmessage = (e) => this.onMessage(e);
            this.userCallbacks = {
                onMessageCtxNFunc,
                onErrorCtxNFunc
            };
        } else {
            throw new Error('WebWorker not supported by browser. Please use an updated browser.')
        }
    }

    postMessage (data = {}, transferData = []) {
        this.worker.postMessage(data, transferData);
    }

    terminate () {
        this.worker.closeWebSocket();
        this.worker.terminate();
        this.worker = null;
    }

    onError (e) {
        console.log('There is an error with the dedicated worker thread', e);
        this.userCallbacks.onErrorCtxNFunc && 
            this.userCallbacks.onErrorCtxNFunc.func.apply(this.userCallbacks.onErrorCtxNFunc.ctx, [e])
    }

    onMessage (e) {
        //console.log('Message from worker thread', e);
        this.userCallbacks.onMessageCtxNFunc && 
            this.userCallbacks.onMessageCtxNFunc.func.apply(this.userCallbacks.onMessageCtxNFunc.ctx, [e.data])
    }
}

export default DedicatedWorkerClass
