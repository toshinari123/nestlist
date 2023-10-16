//This folder provide set of functions that related to HTTP request

async function HTTPGET (url , header) {
    try{
        const response = await fetch(url , header);
        return response;
    }catch{
        const error = await fetch(url , header);
        return error;
    }
}
async function HTTPPOST (url , header , body) {}

async function HTTPDELETE (url , header , body ){}
