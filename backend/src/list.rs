use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use serde_json::{from_str, to_string};
use sha2::{Sha256, Digest};
use crate::types::{List, LIST_LOCATION};

pub fn read_list() -> std::io::Result<List> {
    let mut list_file = File::open(LIST_LOCATION)?;
    let mut contents = String::new();
    list_file.read_to_string(&mut contents)?;
    Ok(from_str(&contents)?)
}

pub fn write_list(contents: List) -> std::io::Result<()> {
    let mut list_file = OpenOptions::new().write(true).truncate(true).open(LIST_LOCATION)?;
    list_file.write_all(to_string(&contents)?.as_bytes())?;
    list_file.flush()?;
    Ok(())
}

pub fn hash_list(l: &List) -> std::io::Result<Vec<u8>> {
    let mut hasher = Sha256::new();
    hasher.update(to_string(l)?.as_bytes());
    Ok(hasher.finalize().to_vec())
}
