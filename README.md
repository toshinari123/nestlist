# nestlist

nestlist is a COOL USEFUL and CONVENIENT tool that EVERYONE in NESTSPACE uses to keep track of current projects and things to do.

features:
- nested tasks: each task can have subtasks which can have subtasks and so on
- thats basically it

# how to test

cd to frontend, and run `python -m http.server 3000`

(optional, right now it works with only frontend: install rust, cd to backend, run `cargo run`)

# how it is implemented

- database: list.json
- REST API (get and put)

# todo

- websocket to real time update the list
