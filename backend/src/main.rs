extern crate serde;
#[macro_use] extern crate rocket;

pub mod init;
pub mod types;
pub mod list;
pub mod log;
pub mod hash;
pub mod cors;
pub mod routes;
pub mod ws;

use std::thread::spawn;
use std::sync::{Arc, RwLock};
use std::net::TcpListener;
use rocket::build;
use crate::init::{init_ws_state, init_rocket_state};
use crate::ws::handle_client;
use crate::cors::Cors;
use crate::routes::{json, edit};
use crate::init::gen_acceptor;

//TODO: security authorization in websocket
//TODO: GENERATE UUID IN BACKEND BRUH
//TODO: use anyhow
#[rocket::main]
async fn main() {
    let state = Arc::new(RwLock::new(init_ws_state().unwrap()));
    spawn(move || {
        if cfg!(feature = "caddy") {
            let addr = if cfg!(feature = "local") { "127.0.0.1" } else { "0.0.0.0" };
            let server = TcpListener::bind(addr.to_owned() + ":8003").unwrap();
            for stream in server.incoming() {
                let state_cl = Arc::clone(&state);
                spawn(move || match stream {
                    Ok(stream) => if let Err(err) = handle_client(stream, state_cl) {
                        error!("handle client error (caddy): {:?}", err);
                    },
                    Err(err) => error!("error (caddy): {:?}", err),
                });
            }
        } else {
            let acceptor = gen_acceptor().unwrap();
            let addr = if cfg!(feature = "local") { "127.0.0.1" } else { "0.0.0.0" };
            let server = TcpListener::bind(addr.to_owned() + ":8003").unwrap();
            for stream in server.incoming() {
                let acc = acceptor.clone();
                let state_cl = Arc::clone(&state);
                spawn(move || match stream {
                    Ok(stream) => {
                        match acc.accept(stream) {
                            Ok(stream) => if let Err(err) = handle_client(stream, state_cl) {
                                error!("handle client error: {:?}", err);
                            },
                            Err(err) => error!("tls error: {:?}", err),
                        }
                    },
                    Err(e) => error!("error accepting stream: {}", e),
                });
            }
        }
    });
    let _ = build().attach(Cors).manage(RwLock::new(init_rocket_state().unwrap())).mount("/", routes![json, edit]).launch().await;
}
