use std::io::{Read, Write};
use std::fs::metadata;
use std::sync::{Arc, RwLock};
use std::time::SystemTime;
use tungstenite::{accept, handshake::HandshakeRole, HandshakeError, Message, Result};
use native_tls::TlsStream;
use crate::types::{WsState, LOG_LOCATION, HASH_LOCATION};
use crate::log::{read_log, get_ind};
use crate::hash::read_hash;

fn must_not_block<Role: HandshakeRole>(err: HandshakeError<Role>) -> tungstenite::Error {
    match err {
        HandshakeError::Interrupted(_) => panic!("Bug: blocking socket would block"),
        HandshakeError::Failure(f) => f,
    }
}

fn process_ws(msg: String, state: Arc<RwLock<WsState>>) -> Result<String, String> {
    if msg.len() < 3 { return Err("message too short".to_string()); }
    let msgv = msg.chars().collect::<Vec<_>>();
    if msgv[2] != ':' { return Err("third char is not colon".to_string()); }
    match msgv[0] {
        //query: ask websocket server something
        'q' => {
            match msgv[1] {
                //query log
                'l' => {
                    if metadata(LOG_LOCATION).map_err(|e| format!("{}", e))?.modified().map_err(|e| format!("{}", e))?.cmp(&state.read().unwrap().log_last_updated).is_gt() {
                        error!("{}", "updating log...");
                        let mut sta_write = state.write().unwrap();
                        sta_write.log = read_log().map_err(|e| format!("{}", e))?;
                        sta_write.log_last_updated = SystemTime::now();
                    }
                    let sta = state.read().unwrap();
                    let (mut head, mut tail) = (0, 0);
                    if !sta.log.is_empty() {
                        head = get_ind(&sta.log[0])?;
                        tail = get_ind(&sta.log[sta.log.len() - 1])?;
                    }
                    if msg.len() == 3 {
                        Ok(format!("qi:{}", tail))
                    } else {
                        let mut res = "ql:".to_string();
                        let mut l: u32 = msg[3..].parse().map_err(|_| "ql: cannot parse integer".to_string())?;
                        if l + 1 < head {
                            return Err("your version is too outdated; please reload".to_string());
                        }
                        for ll in &sta.log {
                            if l + 1 == get_ind(&ll)? {
                                res += &(ll.clone() + "\n");
                                l += 1;
                            }
                        }
                        Ok(res)
                    }
                },
                //query hash
                'h' => {
                    if metadata(HASH_LOCATION).map_err(|e| format!("{}", e))?.modified().map_err(|e| format!("{}", e))?.cmp(&state.read().unwrap().hash_last_updated).is_gt() {
                        let mut sta_write = state.write().unwrap();
                        sta_write.hash = read_hash().map_err(|e| format!("{}", e))?;
                        sta_write.hash_last_updated = SystemTime::now();
                    }
                    let sta = state.read().unwrap();
                    Ok(format!("qh:{}", sta.hash.iter().map(|b| format!("{:x}", b)).collect::<Vec<_>>().join("")))
                },
                //query onlines
                'o' => {
                    Ok(format!("qo:{}", state.read().unwrap().onlines))
                },
                _ => return Err("unknown query".to_string()),
            }
        },
        //change: tell websocket server you made some change in the list
        //TODO: decided to stick with requests for now;
        /*
        'c' => {
            //TODO: parse uuid using Uuid
            let v: Vec<String> = msg[3..].split(' ').collect();
            let _ = match msg[1] {
                //change add
                'a' => {
                    if v.len() != 1 { return Err("invalid ca"); }
                },
                //change delete
                'd' => {

                },
                //change edit
                'e' => {

                },
                _ => return Err("unknown change"),
            };
            //add to log.txt
            //compute hash
        },*/
        //mode: tell websocket server your mode changed
        'm' => {
            match msgv[1] {
                //normal mode
                'n' => {
                    Err("todo".to_string())
                },
                //insert mode
                'i' => {
                    Err("todo".to_string())
                },
                _ => Err("unknown mode".to_string()),
            }
        },
        _ => Err("unknown message type".to_string()),
    }
}

pub fn handle_client<S: Read + Write>(stream: TlsStream<S>, state: Arc<RwLock<WsState>>) -> Result<()> {
    let mut socket = accept(stream).map_err(must_not_block)?;
    loop {
        match socket.read()? {
            Message::Text(msg) => {
                //for debug
                let send_msg = format!("{:?}", process_ws(msg, state.clone()));
                //for production
                //msg = format!("{:?}", process_ws(msg, state).map_err(|_| Err("")));
                socket.send(Message::text(send_msg))?
            },
            Message::Binary(_) | Message::Ping(_) | Message::Pong(_) | Message::Close(_) | Message::Frame(_) => {}
        }
    }
}
