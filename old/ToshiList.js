import DedicatedWorkerClass from '../workers/DedicatedWorkerClass.js'
import { ACTION_STATUS, ACTIONS } from "../workers/constants.js"
class ToshiList extends HTMLElement{
    #root;
    #listeners = {};
    #head = {next: null};
    editing;
    constructor() {
        super();
        this.#root = this.attachShadow({ mode: "closed" });
        this.#init();
    }
    async #init() {
        //todo: use adoptedstylesheet and change 1s to 0s
        const listHTML = await fetch("/components/ToshiList.html");
        this.#root.innerHTML = await listHTML.text();
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
            this.#createList(j, null);
            this.#createVisual();
			this.clearSelection();
            //this.#root.children[1].setAttribute("selected", "true");
        });
    }
    //deal with bad levels later
    #createList(j, par) {
		//console.log(j);
        var a = document.createElement("toshi-item");
        a.core = j.core;
        a.optional = j.optional;
        a.level = a.core.level;
        a.content = (new String(' ')).repeat(a.level) + j.content;
        a.par = par;
        a.lastChild = null;
        this.#root.appendChild(a);
        this.#root.children[this.#root.children.length - 1].setAttribute("id", "uuid:" + a.core.uuid);
        this.#root.children[this.#root.children.length - 1].setAttribute("onclick", "this.getRootNode().host.clearSelection(); this.setAttribute('selected', 'true');");
        this.#root.children[this.#root.children.length - 1].onLongPress(() => {this.#enterOrExitEditing(e, true)});
        var now = this.#root.children[this.#root.children.length - 1];
        if (par) { par.lastChild = now; }
        if (this.#root.children[this.#root.children.length - 2].outerHTML.startsWith("<toshi-item")) {
            now.prev = this.#root.children[this.#root.children.length - 2];
            this.#root.children[this.#root.children.length - 2].next = now;
        }
		//console.log(j.children);
        for (const c of j.children) { this.#createList(c, now); }
    }
    #createVisual() {
        for (let i = 1; i < this.#root.children.length; i++) {
            this.#root.children[i].horizontal();
            this.#root.children[i].vertical(true, false);
        }
        for (let i = 1; i < this.#root.children.length; i++) {
            this.#root.children[i].down();
        }
        for (let i = 1; i < this.#root.children.length; i++) {
            console.log(this.#root.children[i].lastChild)
        }
    }
    #createJson() {
        let uuidMap = {};
        let j = {};
        for (let i = this.#root.children.length - 1; i > 0; i--) {
            j = {};
            let t = this.#root.children[i];
            j.core = t.core;
			j.optional = t.optional;
            //j.content = t.content.slice(t.level, t.content.indexOf('['));
            j.content = t.content.slice(t.core.level);
			if (j.core.uuid in uuidMap) { j.children = uuidMap[j.core.uuid].reverse(); }
            else { j.children = []; }
            if (t.par) {
                if (uuidMap[t.par.core.uuid]) { uuidMap[t.par.core.uuid].push(j); }
                else { uuidMap[t.par.core.uuid] = [j]; }
            }
        }
        return j;
    }
    #save() {
        var j = this.#createJson();
        console.log(j);
        //const url = new URL("https://nestspace.net:8001");
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
        }).then((response) => {
            console.log(response);
            if (!response.ok) {
                return response.text();
            }
        }).then((text) => {
            if (text) {
                //make dialog
                alert(text);
            }
        });
        this.#curLog++;
    }
    #wsInterval;
    connectedCallback() {
        this.createWorker();
        this.#defineCallbacks();
    }
    disconnectedCallback() {
        this.#killCallbacks();
    }
    #passEvent(e, item) {
        const eve = new CustomEvent(e.type + "Item", document.eventOptions);
        item.dispatchEvent(eve);
    }
    #defineCallbacks() {
        for (let i = 0; i < document.eventList.length; i++) {
            (function(index, t) {
                t.addEventListener(document.eventList[index], (e) => {
                    if (e.type in t.#events) {
                        return t.#events[e.type](e);
                    } else {
                        for (let item of t.#root.querySelectorAll("[selected='true']")) {
                            t.#passEvent(e, item);
                        }
                    }
                });
            })(i, this);
        }
        window.addEventListener('unload', () => this.closeWorker());
    }
    #killCallbacks() {
        for (let l in this.#events) {
            this.removeEventListener(l, this.#events[l], true);
        }
    }
    #enterOrExitEditing = (e, boo) => {
        this.editing = boo;
        for (let item of this.#root.querySelectorAll("[selected='true']")) {
            if (!boo) item.setCore();
            this.#passEvent(e, item);
        }
    }
    clearSelection() {
        for (let item of this.#root.querySelectorAll("[selected='true']")) {
            item.removeAttribute("selected");
            if (this.editing) {
                item.setCore();
                this.#passEvent({'type': 'save'}, item);
                this.#save();
            }
        }
        if (this.editing) { this.editing = false; }
    }
    //null for when the list is completely empty
    #add(item, uuid) {
        let a = document.createElement("toshi-item");
        a.prev = item;
        a.next = (item ? item.next : null);
        a.par = item;
        a.lastChild = null;
        if (item && item.next != null) { item.next.prev = a; }
        if (item) { item.next = a; }
        a.core = {};
        a.core.level = (item ? item.core.level : null);
        if (a.next) {
            this.#root.insertBefore(a, a.next);
        } else {
            this.#root.appendChild(a);
        }
        let cur = (item ? item.next : this.#root.children[this.#root.children.length - 1]);
        cur.onChange(' '.repeat(a.core.level + 2) + '[]');
        cur.horizontal();
        cur.down();
        cur.setAttribute("onclick", "this.getRootNode().host.clearSelection(); this.setAttribute('selected', 'true');");
        cur.onLongPress(() => {this.#enterOrExitEditing(e, true)});
        cur.optional = {};
        cur.core.uuid = uuid;
        cur.setCore();
    }
    #replaceAt(str, index, replacement) {
        return str.slice(0, index) + replacement + str.slice(index + replacement.length);
    }
    #del(item) {
        if (item.prev) { item.prev.next = item.next; }
        if (item.next) { item.next.prev = item.prev; }
        console.log("AAA", item.par.lastChild);
        item.remove();

        let p = item.prev;
        let pot = null;
        while (p != null && p.core.level > item.core.level) {
            p = p.prev;
        }
        if (p != item.par) {
            pot = p;
        }

        let n = item.next;
        while (n != null) {
            if (n.par == item) {
                if (p && n.core.level > item.prev.core.level) {
                    n.par = p;
                    p.lastChild = n;
                } else {
                    n.par = item.par;
                    pot = n;
                }
            }
            if (item.lastChild == n) break;
            n = n.next;
        }
        if (item.par && item.par.lastChild == item){
            item.par.lastChild = pot;
            if (pot == p) {
                p.setContent(p.#replaceAt(p.content, p.par.core.level, "\u2517"));
                let pp = item.prev;
        while (pp != null && pp.core.level > item.core.level) {
            pp.setContent(item.#replaceAt(pp.content, item.par.core.level, " ");
            pp = pp.prev;
        }
            }
        }
        console.log(item.par.lastChild);

        item.prev.horizontal();
        n = item.next;
        while (n != null) {
            n.horizontal();
            if (item.lastChild == n) break;
            n = n.next;
        }

        item.vertical(false, false);
        if (item.prev) { item.prev.setAttribute("selected", "true"); }
        else if (item.next) { item.next.setAttribute("selected", "true"); }
    }
    #change(item, new_item) {
        item.setContent(' '.repeat(item.core.level) + new_item.content);
        item.optional = new_item.optional;
    }
    #events = {
        //extract up and down into setSelection
        "up": (e) => {
            for (let item of this.#root.querySelectorAll("[selected='true']")) {
                if (item.prev) {
                    item.removeAttribute("selected");
                    item.prev.setAttribute("selected", "true");
                }
            }
        },
        "down": (e) => {
            for (let item of this.#root.querySelectorAll("[selected='true']")) {
                if (item.next) {
                    item.removeAttribute("selected");
                    item.next.setAttribute("selected", "true");
                }
            }
        },
        "add": (e) => {
            for (let item of this.#root.querySelectorAll("[selected='true']")) {
                this.#add(item, null);
                this.#save();
            }
            if (this.#root.querySelectorAll("toshi-item").length == 0) {
                this.#add(null, null);
                this.#save();
            }
        },
        "del": (e) => {
            for (let item of this.#root.querySelectorAll("[selected='true']")) {
                this.#del(item);
                this.#save();
            }
        },
        "edit": (e) => this.#enterOrExitEditing(e, true),
        "save": (e) => {
            this.#enterOrExitEditing(e, false);
            this.#save();
        },
        "esc": (e) => {
            this.#enterOrExitEditing(e, false)
            this.#init();
        }
    }
    #isWebSocketActiveInWorker;
    #worker;
    #curLog;
    closeWorker() {
        this.#worker.terminate();
        this.#isWebSocketActiveInWorker = false;
    }
    createWorker() {
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
                            //console.log(msg);
                            for (let s of msg.substring(3).split('\\n')) {
                                if (s == '') { continue; }
                                let t = s.indexOf('\\t');
                                let i = parseInt(s.substring(0, t));
                                //errror if content have 2 backslash but watever
                                let o = JSON.parse(s.substring(t + 5).replaceAll('\\', ''));
                                let u = Object.keys(o)[0];
                                switch (s.substring(t + 2, t + 5)) {
                                    case 'ce:':
                                        this.#change(this.#root.getElementById("uuid:" + u), o[u].list);
                                        break;
                                    case 'ca:':
                                        this.#add(this.#root.getElementById("uuid:" + o[u].par), u);
                                        break;
                                    case 'cd:':
                                        this.#del(this.#root.getElementById('uuid:' + u));
                                        break;
                                    default:
                                        console.log('unrecognized log line: ' + s);
                                        break;
                                }
                                this.#curLog = i;
                            }
                            break;
                        case 'qh:':
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
