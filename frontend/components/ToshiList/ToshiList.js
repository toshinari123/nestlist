import {retrieve} from "../../functions/retrieve.js"
import {insertStr} from "../../functions/insertStr.js"
import DedicatedWorkerClass from '../../workers/DedicatedWorkerClass.js'
import { ACTION_STATUS, ACTIONS } from "../../workers/constants.js"
class ToshiList extends HTMLElement{
    #root;
    #stylesheet;
    #listeners = {};
    #items = [];
    #content = "";
    /*
     * item value = {
     *     core = {
     *         uuid,
     *         level,
     *         done,
     *     },
     *     optional,
     *     par, index of (scanning from this upwards, the first element with level < this.level)
     * }
     */
    constructor() {
        super();
        this.#root = this.attachShadow({ mode: "closed" });
        this.#init();
    }
    connectedCallback() {
        this.#createWorker();
    }
    disconnectedCallback() {
        this.#closeWorker();
    }
    async #init() {
        this.#stylesheet = new CSSStyleSheet();
        this.#stylesheet.replaceSync(await retrieve("ToshiList.css", import.meta.url));
        this.#root.adoptedStyleSheets = [this.#stylesheet];
        retrieve("ToshiList.html", import.meta.url).then((h) => {
            this.#root.innerHTML += h;
            this.#defineCallbacks();
            //for use in production with backend:
            //const url = new URL("https://nestspace.net:8001");
            //to test with local backend:
            const url = new URL("https://localhost:8000");
            //to test with no backend (list.json):
            //const url = "list.json";
            fetch(url, {
                method: "GET",
                mode: "cors",
                headers: {
                    "Access-Control-Request-Method": "GET",
                    "Content-Type": "application/json; charset=UTF-8",
                },
                credentials: 'include'
            }).then((response) => response.json()).then((j) => {
                this.#createList(j);
                this.#content = this.#root.getElementById("main").innerHTML;
                this.#root.getElementById("main").init();
                this.#updateVisual();
            });
        });
    }
    //deal with bad levels later
    #createList(j) {
        this.#root.getElementById("main").innerHTML += ' '.repeat(j.core.level) + j.content + '\n';
        let o = {};
        o.core = j.core;
        console.log(j.core.uuid);
        o.optional = j.optional;
        this.#items.push(o);
        for (const c of j.children) { this.#createList(c); }
    }
    //can nlogn but wtv
    #updateVisual() {
        let mostRecentOfEachLevel = new Array(100).fill(null);
        let conts = this.#root.getElementById("main").value.split("\n");
        for (let i = 0; i < this.#items.length; i++) {
            this.#items[i].core.level = 0;
            while (conts[i][this.#items[i].core.level] == ' ') this.#items[i].core.level++;
            if (this.#items[i].core.level >= 100) {
                alert("you have reached the limit");
            }
            let p = null;
            for (let j = 0; j < this.#items[i].core.level; j++) {
                if (!(mostRecentOfEachLevel[j] === null)) {
                    p = ((p == null || p < mostRecentOfEachLevel[j]) ? mostRecentOfEachLevel[j] : p);
                }
            }
            this.#items[i].par = p;
            if (this.#root.children[i + 1]) {
                this.#root.children[i + 1].setAttribute("style", this.#genCss(i));
            } else {
                let d = document.createElement("div");
                d.className = "L";
                d.setAttribute("style", this.#genCss(i));
                this.#root.appendChild(d);
            }
            mostRecentOfEachLevel[this.#items[i].core.level] = i;
        }
        while (this.#root.children.length - 1 > this.#items.length) {
            this.#root.removeChild(this.#root.lastChild);
        }
    }
    #genCss(ind) {
        let o = this.#items[ind];
        if (o.par === null) {
            return "height: 0em; width: 0em;";
        }
        let p = this.#items[o.par];
        let css = "";
        //1234 / 2048 is ratio of width to height i think
        css += "top: " + (o.par + 1) + "em;";
        css += "left: " + ((p.core.level + 1) * 1234 / 2048) + "em;";
        css += "height: " + (ind - o.par - 0.5) + "em;";
        css += "width: " + ((o.core.level - p.core.level - 0.5) * 1234 / 2048) + "em;";
        return css;
    }
    #createJson() {
        let uuidMap = [...Array(this.#items.length)].map(e => []);
        let j = {};
        let a = this.#content.split('\n');
        for (let i = a.length - 2; i >= 0; i--) {
            j = {};
            j.core = this.#items[i].core;
            j.optional = this.#items[i].optional;
            j.content = a[i].trim();
            j.children = uuidMap[i].reverse();
            console.log(uuidMap[i]);
            uuidMap[i] = [];
            if (!(this.#items[i].par === null)) {
                uuidMap[this.#items[i].par].push(j);
            }
        }
        return j;
    }
    #save() {
                this.#curLog++;
        var j = this.#createJson();
        console.log(j);
        //fpr deployment:
        //const url = new URL("https://nestspace.net:8001");
        //for local testing:
        const url = new URL("https://localhost:8000");
        fetch(url, {
            method: "PUT",
            mode: "cors",
            body: JSON.stringify(j),
            headers: {
                "Access-Control-Request-Method": "PUT",
                "Content-Type": "application/json; charset=UTF-8",
            },
            credentials: 'include'
        }).then((response) => response.json()).then((json) => {
            if (!json.ok) {
                alert(json.status);
                console.log(json);
            } else {
            }
        });
    }
    #defineCallbacks() {
        this.addEventListener("input", this.#change);
    }
    #add(ind) {
        let o = {};
        o.core = {};
        o.core.uuid = self.crypto.randomUUID(),
        o.core.level = this.#items[ind - 1].core.level + 2;
        o.core.done = false,
        o.optional = {};
        o.par = ind - 1;
        this.#items.splice(ind, 0, o);
    }
    #del(ind) {
        this.#items.splice(ind + 1, 1);
    }
    #find(uuid) {
        for (let i = 0; i < this.#items.length; i++) {
            if (this.#items[i].core.uuid == uuid) return i;
        }
        return null;
    }
    #change(e) {
        if (e.repeat) return;
        //debugs:
        //console.log(e.inputType);
        //console.log('[' + e.data + ']');
        //console.log(this.selectionStart);
        //inputType to support (https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes):
        //- more than 1 char
        //- drag and drop
        //- insertReplacementText (from spellchecker)
        //- different types of delete
        let ta = this.#root.getElementById("main");
        let pos = ta.selectionStart;
        let newt = ta.value;
        let orig = this.#content;
        if (ta.repeating) return;
        switch (e.inputType) {
            case "insertText": 
                ta.value = insertStr(orig, pos - 1, e.data, false);
                ta.setSelectionRange(pos, pos);
                this.#content = ta.value;
                this.#updateVisual();
                this.#save();
                break;
            case "insertLineBreak":
                if (orig[pos - 1] == '\n') {
                    let r = ta.getCursorRow();
                    ta.value = insertStr(ta.value, pos, ' '.repeat(this.#items[r - 1].core.level + 2) + '[]', false);
                    ta.setSelectionRange(pos + this.#items[r - 1].core.level + 4, pos + this.#items[r - 1].core.level + 4);
                    this.#add(r);
                } else {
                    ta.value = orig;
                    alert('please press enter at end of line');
                    break;
                }
                this.#content = ta.value;
                this.#updateVisual();
                this.#save();
                break;
            case "insertFromPaste":
                if (ta.clipboardData.includes('\n')){
                    ta.value = orig;
                    alert('multiline pasting is currently not supported');
                    break;
                }
                this.#content = ta.value;
                this.#updateVisual();
                this.#save();
                break;
            case "deleteContentBackward":
                if (newt.length < orig.length - 1) {
                    ta.value = orig;
                    alert('deleting selection is currently not supported');
                    break;
                }
                if (orig[pos - 1] == '\n') {
                    if (orig[pos + 1] != '\n') {
                        ta.value = orig;
                        alert('please clear the line before deleting it');
                        break;
                    }
                    ta.value = ta.value.slice(0, pos - 1) + ta.value.substr(pos);
                    ta.setSelectionRange(pos - 1, pos - 1);
                    this.#del(ta.getCursorRow());
                }
                this.#content = ta.value;
                this.#updateVisual();
                this.#save();
                break;
            default:
                ta.value = orig;
                break;
        }
    }
    #isWebSocketActiveInWorker;
    #worker;
    #curLog;
    #wsInterval;
    #closeWorker() {
        this.#worker.terminate();
        this.#isWebSocketActiveInWorker = false;
    }
    #createWorker() {
        this.#worker = new DedicatedWorkerClass({
            func: this.#workerOnMessageHandler,
            ctx: this,
        });
        this.#worker.postMessage({
            action: ACTIONS.INIT,
        });
    }
    #workerOnMessageHandler(workerData) {
        switch(workerData.action) {
            case ACTIONS.WEB_SOCKET_ONOPEN:
                this.#isWebSocketActiveInWorker = true;
                this.#worker.postMessage({
                    action: ACTIONS.QUERY,
                    query: "ql:",
                });
                this.#wsInterval = setInterval(() => {
                    this.#worker.postMessage({
                        action: ACTIONS.QUERY,
                        query: "ql:" + this.#curLog,
                    });
                    this.#worker.postMessage({
                        action: ACTIONS.QUERY,
                        query: "qh:",
                    });
                }, 500);
                break;
            case ACTIONS.DATA_RECEIVED:
                if (workerData.data.substring(0, 3) == 'Ok(') {
                    let msg = workerData.data.substring(4, workerData.data.length - 2);
                    switch (msg.substring(0, 3)) {
                        case 'qi:':
                            //console.log("INIT:", msg.substring(3));
                            this.#curLog = parseInt(msg.substring(3));
                            break;
                        case 'ql:':
                            console.log(msg);
                            for (let s of msg.substring(3).split('\\n')) {
                                if (s == '') { continue; }
                                let t = s.indexOf('\\t');
                                let i = parseInt(s.substring(0, t));
                                //errror if content have 2 backslash but watever
                                let o = JSON.parse(s.substring(t + 5).replaceAll('\\', ''));
                                let u = Object.keys(o)[0];
                                let ta = this.#root.getElementById("main");
                                let a = ta.value.split("\n");
                                let uind = this.#find(u);
                                let pind = this.#find(o[u].par);
                                switch (s.substring(t + 2, t + 5)) {
                                    case 'ce:':
                                        this.#items[uind].core = o[u].list.core;
                                        this.#items[uind].optional = o[u].list.optional;
                                        this.#items[uind].content = o[u].list.content;
                                        a[uind] = ' '.repeat(o[u].list.core.level) +  o[u].list.content;
                                        ta.value = a.join('\n')
                                        this.#content = ta.value;
                                        this.#updateVisual();
                                        ta.autoGrow();
                                        break;
                                    case 'ca:':
                                        a.splice(pind + 1, 0, ' '.repeat(this.#items[pind].core.level + 2) + '[]');
                                        ta.value = a.join('\n');
                                        this.#add(pind + 1);
                                        this.#items[pind + 1].core.uuid = u;
                                        this.#content = ta.value;
                                        this.#updateVisual();
                                        ta.autoGrow();
                                        break;
                                    case 'cd:':
                                        a.splice(uind, 1);
                                        ta.value = a.join('\n');
                                        this.#del(uind);
                                        this.#content = ta.value;
                                        this.#updateVisual();
                                        break;
                                    default:
                                        console.log('unrecognized log line: ' + s);
                                        break;
                                }
                                this.#curLog = i;
                            }
                            break;
                        case 'qh:':
                            //TODO
                            break;
                        default:
                            console.log('unrecognized websocket message: ' + msg);
                            break;
                    }
                } else {
                    console.log('websocket server sent error: ' + workerData.data);
                }
                break;
            default:
                break;
        }
    }
}

export {ToshiList}
