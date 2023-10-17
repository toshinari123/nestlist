# nestlist

nestlist is a COOL USEFUL and CONVENIENT tool that EVERYONE in NESTSPACE uses to keep track of current projects and things to do.

features:
- nested tasks: each task can have subtasks which can have subtasks and so on

# General structure
There are three folders: Database , frontend and backend. Here's the responsibility of each folder. 

- frontend
  . save the files realted to UI and UX only. <br/>
  . The files should be seperate to folders so that the next developer can resure the code <br/>
  . Component Base coding instead on spegattie code. <br/>
  . Comment on top of each file is a must if not comment developer should not use the coede. At least general say what it does. <br/>
- Backend
  . Connect Frontend and Database <br/>
  . Edit / Delete the data from the database <br/>
  . Should be encrypt for sercurity issue <br/>
- Database
  .Check issue column

# Frontend folder structure
  . Assests: For pictures and videos <br/>
  . Components: HTML files that can resure <br/>
  . DataAlgorithm : JS files for fetching data <br/>
  . UserAlgorithm : JS files for fetching UX <br/>
  . Styles: CSS files <br/>
  . index.html 

# Backend Folder Structures
  . Security <br/>
  . DatabaseConnection <br/>
  . FrontendConnection <br/>
  . main.rs 

# Database Folder Structure
  .Data Save in Backend Directly
  
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
- Log in System v1 
- Rewrite the code with better structure v1
- Documentation before going to next version v1
- websocket to real time update the list
