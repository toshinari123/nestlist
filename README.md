# nestlist

nestlist is a COOL USEFUL and CONVENIENT tool that EVERYONE in NESTSPACE uses to keep track of current projects and things to do.

features:
- nested tasks: each task can have subtasks which can have subtasks and so on

# General structure
There are three folders: Database , frontend and backend. Here's the responsibility of each folder. 

- frontend
  . save the files realted to UI and UX only. 
  . The files should be seperate to folders so that the next developer can resure the code
  . Component Base coding instead on spegattie code.
  . Comment on top of each file is a must if not comment developer should not use the coede. At least general say what it does.
- Backend
  . Connect Frontend and Database
  . Edit / Delete the data from the database
  . Should be encrypt for sercurity issue
- Database
  .Check issue column

# Frontend folder structure
  . Assests: For pictures and videos
  . Components: HTML files that can resure
  . DataAlgorithm : JS files for fetching data
  . UserAlgorithm : JS files for fetching UX
  . Styles: CSS files
  . index.html 

# Backend Folder Structures
  . Security 
  . DatabaseConnection
  . FrontendConnection
  . main.rs 

# Database Folder Structure
  .Please reply soon
  
# Variable and Class naming system
  


# how to test

cd to frontend, and run `python -m http.server 3000`

(optional, right now it works with only frontend: install rust, cd to backend, run `cargo run`)

# how it is implemented

- frontend: vanilla JS components
- backend: rust, rocket
- database: list.json
- REST API (get and put)

# todo
- Rewrite the code with better structure
- Database establishment
- Documentation before going to next version
- websocket to real time update the list
