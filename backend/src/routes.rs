use std::collections::BTreeMap;
use std::sync::RwLock;
use rocket::serde::json::Json;
use rocket::http::{Status};
use rocket::response::status;
use rocket::State;
use crate::types::{RocketState, List, CoreData, ListMapItem};
use crate::list::{read_list, hash_list, write_list};
use crate::log::{get_ind, read_log, write_log};
use crate::hash::write_hash;
use crate::init::traverse;

#[get("/")]
pub fn json() -> Json<List> {
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

#[put("/", data = "<new_list_json>")]
pub fn edit(new_list_json: Json<List>, list_state: &State<RwLock<RocketState>>) -> status::Custom<String> {
    let new_list = new_list_json.into_inner();
    match traverse(&new_list, "".to_string()) {
        Ok(new_list_state) => {
            let logg;
            {
                let sta = list_state.read().unwrap();
                let mut e: BTreeMap<String, ListMapItem> = BTreeMap::new();
                let mut a = new_list_state.list_map.clone();
                a.retain(|_, v| !sta.list_map.contains_key(&v.list.core.uuid));
                let mut d = sta.list_map.clone();
                d.retain(|_, v| !new_list_state.list_map.contains_key(&v.list.core.uuid));
                for (k, v) in &sta.list_map {
                    if new_list_state.list_map.contains_key(k) && v.list != new_list_state.list_map.get(k).unwrap().list {
                        e.insert(k.clone(), new_list_state.list_map.get(k).unwrap().clone());
                    }
                }
                if e.len() == 1 && a.len() == 0 && d.len() == 0 {
                    match serde_json::to_string(&e) {
                        Ok(s) => logg = "ce:".to_string() + &s + "\n",
                        Err(_) => return status::Custom(Status::InternalServerError, "json to string error while processing edit".to_string()),
                    }
                } else if e.len() == 0 && a.len() == 1 && d.len() == 0 {
                    match serde_json::to_string(&a) {
                        Ok(s) => logg = "ca:".to_string() + &s + "\n",
                        Err(_) => return status::Custom(Status::InternalServerError, "json to string error while processing edit".to_string()),
                    }
                } else if e.len() == 0 && a.len() == 0 && d.len() == 1 {
                    match serde_json::to_string(&d) {
                        Ok(s) => logg = "cd:".to_string() + &s + "\n",
                        Err(_) => return status::Custom(Status::InternalServerError, "json to string error while processing edit".to_string()),
                    }
                } else if e.len() == 0 && a.len() == 0 && d.len() == 0 {
                    return status::Custom(Status::Accepted, "".to_string())
                } else {
                    if !e.is_empty() {
                        error!("e {} {:?}", e.len(), e.iter().next().unwrap())
                    }
                    if !a.is_empty() {
                        error!("a {} {:?}", a.len(), a.iter().next().unwrap())
                    }
                    if !d.is_empty() {
                        error!("d {} {:?}", d.len(), d.iter().next().unwrap())
                    }
                    return status::Custom(Status::InternalServerError, "error: too many changes".to_string());
                }
            }
            let _ = match read_log() {
                Ok(log) => {
                    if log.is_empty() {
                        write_log(format!("1\t{}", logg))
                    } else {
                        match get_ind(&log[log.len() - 1]) {
                            Ok(i) => write_log(format!("{}\t{}", i + 1, logg)),
                            Err(e) => return status::Custom(Status::InternalServerError, format!("index getting error: {}", e)),
                        }
                    }
                },
                Err(e) => return status::Custom(Status::InternalServerError, format!("log reading error: {}", e)),
            };
            match hash_list(&new_list) {
                Ok(h) => if let Err(e) = write_hash(h) {
                    return status::Custom(Status::InternalServerError, format!("hash writing error: {}", e));
                },
                Err(e) => return status::Custom(Status::InternalServerError, format!("hashing error: {}", e)),
            };
            match write_list(new_list) {
                Ok(()) => status::Custom(Status::Accepted, "".to_string()),
                Err(e) => status::Custom(Status::InternalServerError, format!("writing error: {}", e)),
            };
            {
                let mut sta = list_state.write().unwrap();
                *sta = new_list_state;
            }
            status::Custom(Status::Accepted, "".to_string())
        },
        Err(e) => status::Custom(Status::InternalServerError, format!("traversal error: {:?}", e)),
    }
}
