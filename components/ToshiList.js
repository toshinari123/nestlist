class ToshiList extends HTMLElement{
    #root;
    constructor(){
        super();
        this.#root=this.attachShadow({ mode: "closed" });
        
    }
    addItem(o){
        let t = o.name;
        let a = document.createElement("div");
        a.innerHTML = t;
        this.#root.appendChild(a);
    }
    addNthItem(o,n){
        let t = o.name;
        let a = document.createElement("div");
        a.innerHTML = t;
        this.#root.insertBefore(a,this.#root.children[n]);
    }
    removeItem(o){
    let nm = o.name;
    for(let i=0;i<this.#root.children.length;i++){
       if(this.#root.children[i].innerHTML = nm){
           this.#root.children[i].remove();
           return;
           };
       };
    }
    removeNthItem(n){
        this.#root.children[i].remove();
    }
    get selection(){
        return this.#root.querySelector("[selected='true']").innerHTML;
        
    }
    set selection(nm){
        this.#root.querySelector("[selected='true']").removeAttribute("selected");
       for(let i=0;i<this.#root.children.length;i++){
           if(this.#root.children[i].innerHTML = nm){
               this.#root.children[i].setAttribute("selected","true");
           };
       }; 
    }
    get selectionPos(){
        return Array.prototype.indexOf.call(this.#root.querySelector("[selected='true']").parentNode,this.#root.querySelector("[selected='true']"));
    }
    set selectionPos(n){
        this.#root.querySelector("[selected='true']").removeAttribute("selected");
        this.#root.children[n].setAttribute("selected","true");
    }
}
