async function HTTPGET (url , header) {
    try{
        const response = await fetch(url , header);
        return response;
    }catch{
        const error = await fetch(url , header);
        return error;
    }
}