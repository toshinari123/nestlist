    #updateThis(cur) {
        let newlevel = this.#items[cur].core.level;
        let ind = cur - 1;
        while (this.#items[ind]) {
            if (this.#items[ind].core.level <= newlevel){
                this.#items[cur].sis = ind;
                break;
            }
            ind--;
        }
        if (!this.#items[ind]) this.#items[cur].sis = -1;
        while (this.#items[ind]) {
            if (this.#items[ind].core.level < newlevel){
                this.#items[cur].par = ind;
                this.#root.children[cur + 1].setAttribute("style", this.#genCss(cur));
                break;
            }
            ind--;
        }
        if (!this.#items[ind]) {
            this.#items[cur].par = -1;
            this.#root.children[cur + 1].setAttribute("style", this.#genCss(cur));
        }
    }
    #del(cur) {
        //refind all the sis and pars (sad n^2)
        this.#items.splice(cur + 1, 1);
        this.#root.removeChild(this.#root.children[cur]);
        while (this.#items[cur]) {
            this.#updateThis(cur);
            cur++;
        }
    }
    #add(cur) {
        let o = {};
        o.core = {};
        o.core.uuid = self.crypto.randomUUID(),
        o.core.level = this.#items[cur - 1].core.level + 2;
        o.core.done = false,
        o.optional = {};
        o.par = cur - 1;
        o.sis = cur - 1;
        this.#items.splice(cur, 0, o);
        let d = document.createElement("div");
        d.className = "L";
        d.setAttribute("style", this.#genCss(cur));
        if (this.#root.children[cur + 1]) {
            this.#root.insertBefore(d, this.#root.children[cur + 1]);
        } else {
            this.#root.appendChild(d);
        }
        let ind = cur + 1;
        while (this.#items[ind]) {
            if (this.#items[ind].sis >= cur) this.#items[ind].sis++;
            if (this.#items[ind].par >= cur) this.#items[ind].par++;
            if (this.#items[ind].core.level >= this.#items[cur].core.level && this.#items[ind].sis < cur) {
                this.#items[ind].sis = cur;
            }
            if (this.#items[ind].core.level > this.#items[cur].core.level && this.#items[ind].par < cur) {
                this.#items[ind].par = cur;
            }
            this.#root.children[ind + 1].setAttribute("style", this.#genCss(ind));
            ind++;
        }
    }
