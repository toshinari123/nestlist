class ToshiButton extends HTMLElement {
    #root;
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
        this.#stylesheet.replaceSync(await this.#retrieve("ToshiButton.css"));
        var nerdss = new CSSStyleSheet();
        const nerdfile = await fetch('https://www.nerdfonts.com/assets/css/combo.css');
        nerdss.replaceSync(await nerdfile.text());
        this.#root.adoptedStyleSheets = [this.#stylesheet, nerdss];
        this.#root.innerHTML += await this.#retrieve("ToshiButton.html");
        this.#root.querySelector("div").setAttribute("class", this.getAttribute("icon"));
    }
}

export {ToshiButton};
