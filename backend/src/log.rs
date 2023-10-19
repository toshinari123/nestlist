use std::fs::{File, OpenOptions, metadata};
use std::io::{Read, Seek, SeekFrom, Write, ErrorKind};
use crate::types::{LOG_LOCATION, LOG_LAST_BYTES};

pub fn read_log() -> std::io::Result<Vec<String>> {
    let mut log_file = File::open(LOG_LOCATION)?;
    let mut buf = vec![];
    let long = metadata(LOG_LOCATION)?.len() > (-LOG_LAST_BYTES) as u64;
    if long { log_file.seek(SeekFrom::End(LOG_LAST_BYTES))?; }
    log_file.read_to_end(&mut buf)?;
    let binding = String::from_utf8(buf).map_err(|_| std::io::Error::new(ErrorKind::Other, "log utf8 error"))?;
    let mut v: Vec<_> = binding.split('\n').collect();
    if long { v.remove(0); }
    if !v.is_empty() { v.remove(v.len() - 1); }
    Ok(v.into_iter().map(str::to_string).collect())
}

pub fn write_log(line: String) -> std::io::Result<()> {
    let mut log_file = OpenOptions::new().append(true).open(LOG_LOCATION)?;
    log_file.write_all(line.as_bytes())?;
    log_file.flush()?;
    Ok(())
}

pub fn get_ind(log_line: &String) -> Result<u32, String> {
    Ok(log_line
        .splitn(2, '\t').next().map_or(Err("a line in log does not have tab".to_string()), |v| Ok(v.to_string()))?
        .parse().map_err(|_| "a line in log does not have valid index".to_string())?)
}
