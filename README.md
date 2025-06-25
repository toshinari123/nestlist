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

backend: `nix develop .#backend`

frontend + caddy: `nix develop .#caddy`

just run the above commands in root, no need to cd

nix develop puts up a shell, so to exit completely you have to stop the process and type `exit`

for first time (and once in a while) using caddy, it will need sudo access to install the local certificate; if you encounter trouble entering sudo password like me, just stop the caddy and enter `sudo caddy trust` then `exit` and restart the nix developer shell

note: need to manually trust certs by accessing the following in browser and press acept risk and continue:
- https://localhost:3000
- https://localhost:8000 
- https://localhost:8002 

note note: need to allow insecure self-signed wss connection (on chrome its chrome://flags/#allow-insecure-localhost)

# how it is implemented

- frontend: vanilla JS components
- backend: rust, rocket
- database: list.json
- REST API (get and put)

# todo
- Log in System v1 
- Rewrite the code with better structure v1
- Documentation before going to next version v1

# versions
v1: only frontend
v2: rust backend
v3: websockets + refactored backend + rewrote frontend
v4: tried out using caddy because it can autogen tls certs for local testing, moved cors into caddy as well

# images
![image](https://miro.medium.com/v2/resize:fit:1100/format:webp/1*QvoCVKVXB76z4OlKG2PP-w.png)
![image](https://lucid.app/publicSegments/view/c039f172-055c-4ac9-9289-062e8cc8b1a9/image.png)
