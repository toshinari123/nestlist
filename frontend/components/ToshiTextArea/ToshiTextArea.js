class ToshiTextArea extends HTMLTextAreaElement {
    isOnBegin;
    #down = {};
    clipboardData = "";
    constructor() {
        super();
    }
    async connectedCallback() {
        this.addEventListener("keydown", this.#preventRepeat);
        this.addEventListener("keyup", this.#keyUp);
        this.addEventListener("click", this.#setCursor);
        this.addEventListener("paste", this.#paste);
    }
    init() {
        this.autoGrow();
        this.isOnBegin = true;
    }
    autoGrow() {
        if (this.scrollHeight > this.clientHeight) {
            this.style.height = `${this.scrollHeight}px`;
        }
        if (this.scrollWidth > this.clientWidth) {
            this.style.width = `${this.scrollWidth}px`;
        }
    }
    //AAAAAAAAAAAAAA repeat is not willing to be disabled
    repeating = false;
    #preventRepeat(e) {
        if (this.#down[e.keyCode]){
            this.repeating = true;
            return;
        }
        this.#down[e.keyCode] = true;
    }
    #keyUp(e) {
        this.repeating = false;
        this.#down[e.keyCode] = false;
        this.#setCursor();
        this.autoGrow();
    }
    #setCursor() {
        let pos = this.selectionStart - 1;
        while (pos >= 0 && this.value[pos] == ' ') pos--;
        this.isOnBegin = (pos == -1 || this.value[pos] == '\n') && this.value[this.selectionStart] != ' ';
        if (this.selectionStart == this.selectionEnd) {
            if (pos == -1 || this.value[pos] == '\n'){
                while (this.value[this.selectionStart] == ' ') this.selectionStart++;
                this.isOnBegin = true;
            }
        }
    }
    #paste(e) {
        let cd = e.clipboardData || window.clipboardData || e.originalEvent.clipboardData
        this.clipboardData = cd.getData("text");
    }
    getCursorRow() {
        /* sadly doesnt work (dk why)
        let editorCoords = this.getClientRects()[0];
        let cursorCoords = window.getSelection()?.getRangeAt(0).getClientRects()[0];
        return Math.floor((cursorCoords.y - editorCoords.y) / cursorCoords.height);
        */
        return this.value.substr(0, this.selectionStart).split("\n").length - 1;
    }
}

export {ToshiTextArea};
