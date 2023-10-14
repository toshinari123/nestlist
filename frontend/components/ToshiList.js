// WHAT IS THIS ??????  SEPERATE IT TO A FEW FILES THANKS
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
        //const url = new URL("https://localhost:8001");
        //to test with no backend (list.json):
        const url = "list.json";
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
		console.log(j);
        var a = document.createElement("toshi-item");
        a.core = j.core;
        a.optional = j.optional;
        a.level = a.core.level;
        a.content = (new String(' ')).repeat(a.level) + j.content;
        a.par = par;
        a.lastChild = null;
        this.#root.appendChild(a);
        this.#root.children[this.#root.children.length - 1].setAttribute("onclick", "this.getRootNode().host.clearSelection(); this.setAttribute('selected', 'true');");
        this.#root.children[this.#root.children.length - 1].onLongPress(() => {this.#enterOrExitEditing(e, true)});
        var now = this.#root.children[this.#root.children.length - 1];
        if (par) { par.lastChild = now; }
        if (this.#root.children[this.#root.children.length - 2].outerHTML.startsWith("<toshi-item")) {
            now.prev = this.#root.children[this.#root.children.length - 2];
            this.#root.children[this.#root.children.length - 2].next = now;
        }
		console.log(j.children);
        for (const c of j.children) { this.#createList(c, now); }
    }
    #createVisual() {
        for (let i = 1; i < this.#root.children.length; i++) {
            this.#root.children[i].horizontal();
            this.#root.children[i].vertical(true, false);
        }
    }
    #createJson() {
        let uuidMap = {};
        let j = {};
        for (let i = this.#root.children.length - 1; i > 0; i--) {
            j = {};
            let t = this.#root.children[i];
            j.core = t.core;
            j.core.level = t.level;
			j.optional = t.optional;
            //j.content = t.content.slice(t.level, t.content.indexOf('['));
            j.content = t.content.slice(t.level);
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
        const url = new URL("https://nestspace.net:8001");
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
            }
        });
    }
    connectedCallback() {
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
        this.editing = false;
        for (let item of this.#root.querySelectorAll("[selected='true']")) {
            item.removeAttribute("selected");
            item.setCore();
            this.#passEvent({'type': 'save'}, item);
            this.#save();
        }
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
                let a = document.createElement("toshi-item");
                a.prev = item;
                a.next = item.next;
                a.par = item;
                a.lastChild = null;
                if (item.next != null) { item.next.prev = a; }
                item.next = a;
                //deliberaly wrong level so onChange will update (better ways?)
                a.level = item.level;
                //change above line after adding layers
                this.#root.insertBefore(a, a.next);
                item.next.onChange(' '.repeat(a.level + 2) + '[]');
                item.next.setAttribute("onclick", "this.getRootNode().host.clearSelection(); this.setAttribute('selected', 'true');");
                item.next.onLongPress(() => {this.#enterOrExitEditing(e, true)});
                item.next.optional = {};
                item.next.core = {};
                item.next.setCore();
                //item.removeAttribute("selected");
            }
            if (this.#root.querySelectorAll("toshi-item").length == 0) {
                let a = document.createElement("toshi-item");
                a.prev = null;
                a.next = null;
                a.par = null;
                a.lastChild = null;
                //deliberaly wrong level so onChange will update (better ways?)
                a.level = 0;
                //change above line after adding layers
				a.core = {};
				a.setCore();
				a.optional = {};
                this.#root.appendChild(a);
                this.#root.querySelector("toshi-item").onChange("root");
                this.#root.querySelector("toshi-item").setAttribute("onclick", "this.getRootNode().host.clearSelection(); this.setAttribute('selected', 'true');");
                item.next.onLongPress(() => {this.#enterOrExitEditing(e, true)});
            }
            this.#save();
        },
        "del": (e) => {
            for (let item of this.#root.querySelectorAll("[selected='true']")) {
                if (item.prev) { item.prev.next = item.next; }
                if (item.next) { item.next.prev = item.prev; }
                item.vertical(false, true);
                item.remove();
                let p = item.lastChild;
                while (p != null && p != item.prev) {
                    if (p.par == item) {
                        p.par = item.prev;
                        p.horizontal();
                    }
                    p = p.prev;
                }
                if (item.prev) { item.prev.setAttribute("selected", "true"); }
                else if (item.next) { item.next.setAttribute("selected", "true"); }
            }
            this.#save();
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
}

export {ToshiList}
