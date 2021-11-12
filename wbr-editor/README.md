# wbr-editor

WBR Visual editor, allowing for quick, safe and intuitive iterative development of *Smart Workflows*.

## Watch out!
The editor is currently (as of 12.11.2021) rather stub and not usable by any means, as my main focus is on the interpreter and backend part. Still, stay tuned!

## Setup, debugging

- Run the backend server in the `/backend/build` folder (if not present, run tsc in the folder first).
- You can use either `frontend/bare-html` (html file) or `frontend/react-app` (react app) for frontend.
- Backend and frontend use [Socket.IO](https://socket.io/) for bidirectional communication. In case of module errors, consult the `package.json` files or contact the author. Happy hacking! :)