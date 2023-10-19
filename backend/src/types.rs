use std::collections::BTreeMap;
use std::time::SystemTime;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct CoreData {
    //change this to Uuid from some uuid crate later
    pub uuid: String,
    pub level: u32,
    pub done: bool,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct List {
    pub content: String,
    pub core: CoreData,
    pub optional: BTreeMap<String, String>,
    pub children: Vec<List>,
}

pub struct WsState {
    pub log: Vec<String>,
    pub onlines: u32,
    //TODO: modes: map from each user to what mode they are in?
    pub hash: Vec<u8>,
    pub log_last_updated: SystemTime,
    pub hash_last_updated: SystemTime,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
pub struct ListMapItem {
    pub list: List,
    pub par: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct RocketState {
    //change to Uuid
    pub list_map: BTreeMap<String, ListMapItem>
}

pub const LOG_LAST_BYTES: i64 = -2048;
//deployment:
//pub const LOG_LOCATION: &str = "/code/log.txt";
//pub const LIST_LOCATION: &str = "/code/list.json";
//pub const HASH_LOCATION: &str = "/code/HASH";
//pub const IDENTITY_LOCATION: &str = "/code/identity.pfx";
//local testing:
pub const LOG_LOCATION: &str = "log.txt";
pub const LIST_LOCATION: &str = "list.json";
pub const HASH_LOCATION: &str = "HASH";
pub const IDENTITY_LOCATION: &str = "../cert/CA/localhost/identity.pfx";
