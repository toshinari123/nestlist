function insertStr(str, index, toinsert, replace) {
    return str.slice(0, index) + toinsert + str.slice(index + (replace ? toinsert.length : 0));
}

export {insertStr}
