use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use crate::types::HASH_LOCATION;

pub fn read_hash() -> std::io::Result<Vec<u8>> {
    let mut list_file = File::open(HASH_LOCATION)?;
    let mut contents = String::new();
    list_file.read_to_string(&mut contents)?;
    Ok(contents.as_bytes().to_vec())
}

pub fn write_hash(h: Vec<u8>) -> std::io::Result<()> {
    let mut hash_file = OpenOptions::new().write(true).truncate(true).open(HASH_LOCATION)?;
    hash_file.write_all(&h.iter().map(|b| format!("{:x}", b)).collect::<Vec<_>>().join("").into_bytes())?;
    hash_file.flush()?;
    Ok(())
}
