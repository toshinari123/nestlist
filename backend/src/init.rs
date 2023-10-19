use std::fs::File;
use std::io::{Read, ErrorKind};
use std::sync::Arc;
use std::time::SystemTime;
use std::collections::BTreeMap;
use native_tls::{Identity, TlsAcceptor};
use crate::list::read_list;
use crate::log::read_log;
use crate::hash::read_hash;
use crate::types::{List, WsState, RocketState, ListMapItem, IDENTITY_LOCATION};

pub fn gen_acceptor() -> Result<Arc<TlsAcceptor>, ()> {
    let mut file = File::open(IDENTITY_LOCATION).unwrap();
    let mut identity = vec![];
    file.read_to_end(&mut identity).unwrap();
    match Identity::from_pkcs12(&identity, "nestlist") {
        Ok(identity) => {
            let acceptor = TlsAcceptor::new(identity).unwrap();
            Ok(Arc::new(acceptor))
        },
        Err(e) => {
            error!("error making acceptor: {}", e);
            Err(())
        }
    }
}

pub fn init_ws_state() -> std::io::Result<WsState> {
    Ok(WsState {
        log: read_log()?,
        onlines: 0,
        hash: read_hash()?,
        log_last_updated: SystemTime::UNIX_EPOCH,
        hash_last_updated: SystemTime::UNIX_EPOCH,
    })
}

pub fn traverse(list: &List, par: String) -> std::io::Result<RocketState> {
    let mut rocket_state = RocketState { list_map: BTreeMap::new() };
    rocket_state.list_map.insert(list.core.uuid.clone(), ListMapItem {
        list: List {
            content: list.content.clone(),
            core: list.core.clone(),
            optional: list.optional.clone(),
            children: vec![],
        },
        par,
    });
    let mut cnt = 1;
    for l in &list.children {
        let mut rs = traverse(&l, list.core.uuid.clone())?;
        cnt += rs.list_map.len();
        rocket_state.list_map.append(&mut rs.list_map);
    }
    if rocket_state.list_map.len() != cnt {
        Err(std::io::Error::new(ErrorKind::Other, "uuid clash"))
    } else {
        Ok(rocket_state)
    }
}

pub fn init_rocket_state() -> std::io::Result<RocketState> {
    let list = read_list()?;
    traverse(&list, "".to_string())
}
