//todo: organize data structure stuff into ToshiDS.js
class ToshiItem extends HTMLElement{
    #root;
    #listeners = {};
    #observer;
    #content;
    //make a pointers object instead
    par;
    lastChild;
    next;
    prev;
    core;
    optional;
    #stylesheet;
    constructor() {
        super();
        this.#root = this.attachShadow({ mode: "closed" });
        this.#init();
    }
    async #retrieve(filename) {
        const file = await fetch(new URL('./' + filename, import.meta.url));
        return await file.text();
    }
    async #init() {
        this.#stylesheet = new CSSStyleSheet();
        this.#stylesheet.replaceSync(await this.#retrieve("ToshiItem.css"));
        this.#root.adoptedStyleSheets = [this.#stylesheet];
        this.#root.innerHTML += await this.#retrieve("ToshiItem.html");
        this.#root.querySelector("div").innerHTML = this.content;
        //this.setAttribute("selected", "true");
        //todo: auto enter editing mode when init (need to set list.editing)
        //this.#events["editItem"]({});
    }
    static get observedAttributes() {
        return ["selected"];
    }
    attributeChangedCallback(name, oldVal, newVal) {
        if (name == "selected") {
            if (newVal) {
                this.#defineAttrCallbacks();
                this.#root.adoptedStyleSheets[0].insertRule(`div,input,textarea{background-color:gray;}`, 0);
                this.#root.adoptedStyleSheets = [this.#stylesheet];
            } else {
                this.#killAttrCallbacks();
                this.#stylesheet.deleteRule(0);
                this.#root.adoptedStyleSheets = [this.#stylesheet];
            }
        }
    }
    #defineAttrCallbacks() {
        for (let i = 0; i < Object.entries(this.#events).length; i++) {
            (function(index, t) {
                let [name, f] = Object.entries(t.#events)[index];
                t.addEventListener(name, f);
            })(i, this);
        }
    }
    #killAttrCallbacks() {
        for (let l in this.#events) {
            this.removeEventListener(l, this.#events[l], true);
        }
    }
    get content() {
        return this.#content;
    }
    //for init: the html elements are not made
    set content(newContent) {
        this.#content = newContent;
    }
    //use this after init
    setContent(newContent) {
        this.#content = newContent.trim();
        if (this.#root.querySelector("div")) {
            this.#root.querySelector("div").innerHTML = newContent;
        }
        if (this.#root.querySelector("input")) {
            this.#root.querySelector("input").value = newContent;
        }
        this.onChange(newContent);
    }
    #findLevel(s) {
        let i = 0;
        for (; i < s.length; i++) {
            if (!document.nestSymbols.includes(s[i])) { break; }
        }
        return i;
    }
    #findPar() {
        if (this.core.level == 0) { return null; }
        let p = this;
        while (p != null && p.core.level >= this.core.level) { p = p.prev; };
        return p;
    }
    #replaceAt(str, index, replacement) {
        return str.slice(0, index) + replacement + str.slice(index + replacement.length);
    }
    //check if this.par exist before calling vertical
    //this function finds the bottommost item above this that has level <= this.core.level (parent or sibling)
    vertical(addordel, realdel) {
        let p = this.prev;
        while (p != null && p.core.level > this.core.level) {
            p.setContent(this.#replaceAt(p.content, this.par.core.level, addordel ? "\u2503" : " "));
            p = p.prev;
        }
        if (p != this.par) {
            if (this.par.lastChild == this) { p.setContent(this.#replaceAt(p.content, this.par.core.level, addordel ? "\u2523" : "\u2517")); }
            if (realdel) {
                if (this.par.lastChild == this) { this.par.lastChild = p; }
                p.lastChild = this.lastChild;
            }
        } else {
            if (realdel && this.par.lastChild == this) { this.par.lastChild = null; }
        }
    }
    down() {
        let n = this.next;
        let prev = null;
        while (n != null && n.core.level > this.core.level) {
            if (n.par == this.par) n.par = this;
            if (n.par == this) prev = n;
            n = n.next;
        }
        if (!this.lastChild) this.lastChild = prev;
        if (this.par && n && n.core.level <= this.par.core.level) {
            this.par.lastChild = this;
        }
        this.horizontal();
        n = this.next;
        while (n != null && n.core.level > this.core.level) {
            n.horizontal();
            n = n.next;
        }
    }
    horizontal() {
		let temp = "";
        for (let i = 0; i < (this.par ? this.par.core.level : 0); i++) {
            temp = temp + ((this.par.content[i] == "\u2503" || this.par.content[i] == "\u2523") ? "\u2503" : " ");
        }
        this.setContent(temp + this.content.slice((this.par ? this.par.core.level : 0)));
        if (this.par) { this.setContent(this.#replaceAt(this.content, this.par.core.level, this.par.lastChild == this ? "\u2517" : "\u2523")); }
        for (let i = (this.par ? this.par.core.level : 0) + 1; i < this.core.level; i++) {
            this.setContent(this.#replaceAt(this.content, i, "\u2501"));
        }
    }
    onChange(v) {
        //if (v[v.length - 1] != ']' || (v.match(/\[/g) || []).length != 1 || (v.match(/\]/g) || []).length != 1) {
        //    this.#setContent(this.content);
        //    return;
        //}
        this.content = v;
        var newLevel = this.#findLevel(v);
        if (this.core.level != newLevel) {
            if (this.par && this.par.lastChild == this) { this.vertical(false, false); }
            this.core.level = newLevel;
            this.par = this.#findPar();
            if (this.par) {
                //compute if current is the last child of parent
                if (this.par.lastChild === null || this.par.lastChild === undefined || this.par.lastChild === this) {
                    this.par.lastChild = this;
                } else {
                    let p = this.prev;
                    while (p != null && p.par != this.par && p != this.par) { p = p.prev; }
                    if (p === this.par.lastChild) { this.par.lastChild = this; }
                }
                this.horizontal();
                this.vertical(true, false);
            }
        }
    }
    onLongPress(callback) {
        let timer;
        this.addEventListener('touchstart', () => {
            timer = setTimeout(() => {
                timer = null;
                callback();
            }, 500);
        });
        function cancel() {
            clearTimeout(timer);
        }
        this.addEventListener('touchend', cancel);
        this.addEventListener('touchmove', cancel);
    }
    setCore() {
        if (!this.core.uuid) { this.core.uuid = crypto.randomUUID(); }
        this.setAttribute("id", "uuid:" + this.core.uuid);
        if (!this.core.done) { this.core.done = false; }
    }
    #events = {
        "editItem": (e) => {
            let a = this.#root.querySelector("div");
            let b = document.createElement("input");
            b.setAttribute("autofocus", true);
            b.setAttribute("onInput", "this.getRootNode().host.onChange(this.value)");
            b.value = a.innerHTML;
            a.replaceWith(b);
            this.#root.querySelector("input").focus();
        },
        "saveItem": (e) => {
            let b = this.#root.querySelector("input");
            let a = document.createElement("div");
            this.content = b.value;
            a.innerHTML = this.content;
            b.replaceWith(a);
        },
        "escItem": (e) => {
            let b = this.#root.querySelector("input");
            let a = document.createElement("div");
            a.innerHTML = this.content;
            b.replaceWith(a);
        },
        "tabItem": (e) => {
            this.setContent("  " + this.content);
            this.onChange(this.content);
        }
    }
}

export {ToshiItem}
