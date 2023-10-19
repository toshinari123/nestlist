async function retrieve(filename, url) {
    const file = await fetch(new URL('./' + filename, url));
    return await file.text();
}

export {retrieve};
