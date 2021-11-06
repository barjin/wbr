# wbr-editor

WBR Visual editor, allowing for quick, safe and intuitive iterative development of *Smart Workflows*.

## Setup, debugging

- Backend server in the `/backend` folder runs an instance of *Playwright*
- You can use either `frontend/bare-html` or `frontend/react-app` for frontend.
- Backend and frontend use [Socket.IO](https://socket.io/) for bidirectional communication. In case of module errors, consult the `package.json` files or contact the author. Happy hacking! :)