#![allow(macro_expanded_macro_exports_accessed_by_absolute_paths)]
#[macro_use] extern crate rocket;
extern crate serde;
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::collections::BTreeMap;
use std::net::{TcpListener, TcpStream};
use std::thread::spawn;
use std::sync::Arc;
use rocket::serde::json::Json;
use rocket::http::{Status, Method, Header};
use rocket::{Request, Response};
use rocket::response::status;
use rocket::fairing::{Fairing, Info, Kind};
use serde::{Serialize, Deserialize};
use tungstenite::{accept, handshake::HandshakeRole, Error, HandshakeError, Message, Result};
use native_tls::{Identity, TlsAcceptor, TlsStream};

pub struct Cors;

#[rocket::async_trait]
impl Fairing for Cors {
    fn info(&self) -> Info {
        Info {
            name: "Adds CORS headers to responses",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        if request.method() == Method::Options {
            response.set_status(Status::NoContent);
            response.set_header(Header::new(
                "Access-Control-Allow-Methods",
                "GET, PUT",
            ));
            let h = "Accept, Accept-Encoding, Accept-Language, Connection, Content-Type, Host, Origin, Referer, Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site, Sec-Ch-Ua, Sec-Ch-Ua-Mobile, Sec-Ch-Ua-Platform, User-Agent";
            response.set_header(Header::new("Access-Control-Allow-Headers", h));
        }
        response.set_header(Header::new("Access-Control-Allow-Origin", "https://nestspace.net"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }   
}

#[derive(Serialize, Deserialize)]
struct CoreData {
    //change this to Uuid from some uuid crate later
    uuid: String,
    level: u32,
    done: bool,
}

#[derive(Serialize, Deserialize)]
struct List {
    content: String,
    core: CoreData,
    optional: BTreeMap<String, String>,
    children: Vec<List>,
}

fn read_list() -> std::io::Result<List> {
    let mut list_file = File::open("/code/list.json")?;
    let mut contents = String::new();
    list_file.read_to_string(&mut contents)?;
    Ok(serde_json::from_str(&contents)?)
}

fn write_list(contents: List) -> std::io::Result<()> {
    let mut list_file = OpenOptions::new().write(true).truncate(true).open("/code/list.json")?;
    list_file.write_all(serde_json::to_string(&contents)?.as_bytes())?;
    list_file.flush()?;
    Ok(())
}

#[get("/")]
fn json() -> Json<List> {
    match read_list() {
        Ok(list) => Json(list),
        Err(e) => Json(List { 
            content: "error reading file in backend: ".to_string() + &e.to_string(), 
            core: CoreData { uuid: "error".to_string(), level: 0, done: false },
            optional: BTreeMap::new(),
            children: vec![],
        }),
    }
}

//return a status or potential error or smth?
#[put("/", data = "<new_list>")]
fn edit(new_list: Json<List>) -> status::Custom<()> {
    match write_list(new_list.into_inner()) {
        Ok(()) => status::Custom(Status::Accepted, ()),
        Err(_e) => status::Custom(Status::InternalServerError, ()),
    }
}

fn must_not_block<Role: HandshakeRole>(err: HandshakeError<Role>) -> Error {
    match err {
        HandshakeError::Interrupted(_) => panic!("Bug: blocking socket would block"),
        HandshakeError::Failure(f) => f,
    }
}

fn handle_client<S: Read + Write>(stream: TlsStream<S>) -> Result<()> {
    let mut socket = accept(stream).map_err(must_not_block)?;
    loop {
        match socket.read()? {
            msg @ Message::Text(_) | msg @ Message::Binary(_) => {
                socket.send(msg)?;
            }
            Message::Ping(_) | Message::Pong(_) | Message::Close(_) | Message::Frame(_) => {}
        }
    }
}

#[rocket::main]
async fn main() {
    spawn(|| {
        let mut file = File::open("/code/identity.pfx").unwrap();
        let mut identity = vec![];
        file.read_to_end(&mut identity).unwrap();
        let identity = Identity::from_pkcs12(&identity, "toshinari918").unwrap();
        let acceptor = TlsAcceptor::new(identity).unwrap();
        let acceptor = Arc::new(acceptor);
        let server = TcpListener::bind("0.0.0.0:8002").unwrap();
        for stream in server.incoming() {
            let acc = acceptor.clone();
            spawn(move || match stream {
                Ok(stream) => {
                    match acc.accept(stream) {
                    	Ok(stream) => if let Err(err) = handle_client(stream) {
                        	match err {
                            	Error::ConnectionClosed => debug!("connection closed"),
                            	Error::Protocol(e) => debug!("protocol error: {:?}", e),
                            	Error::Utf8 => debug!("utf8 error"),
                            	e => error!("test: {}", e),
                        	}
                    	},
                    	Err(err) => debug!("tls error: {:?}", err),
                    }
                },
                Err(e) => error!("Error accepting stream: {}", e),
            });
        }
    });
    let _ = rocket::build().attach(Cors).mount("/", routes![json, edit]).launch().await;
}
