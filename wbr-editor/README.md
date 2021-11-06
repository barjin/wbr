# wbr-editor

WBR Visual editor, allowing for quick, safe and intuitive iterative development of *Smart Workflows*.

## Setup, debugging

- Run the backend server in the `/backend/build` folder (if not present, run tsc in the folder first).
- You can use either `frontend/bare-html` (html file) or `frontend/react-app` (react app) for frontend.
- Backend and frontend use [Socket.IO](https://socket.io/) for bidirectional communication. In case of module errors, consult the `package.json` files or contact the author. Happy hacking! :)