import express from 'express';
import cors from 'cors';
import fileUpload, { UploadedFile } from 'express-fileupload';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import socket from 'socket.io';
import http from 'http';
import Performer from './performer';
import SWInterpret from '../../wbr-interpret/src/interpret';

const app = express();
const uploadsDir = 'uploads';

let turnOffTimer : ReturnType<typeof setTimeout>;

const performers : Performer[] = [];

app.use(fileUpload({
  createParentPath: true,
}));

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new socket.Server(server);
/**
 * Uploads new workflow.
 */
app.post('/workflow', async (req, res) => {
  try {
    if (!req.files || !req.files.workflow) {
      throw new Error('No files uploaded.');
    } else {
      const { workflow } = <{ workflow: UploadedFile }>req.files;

      const filePath = path.join(uploadsDir, workflow.name);

      if (fs.existsSync(filePath)) {
        throw new Error('This file already exists.');
      }

      JSON.parse(workflow.data.toString()); // Throws if workflow is not valid JSON

      workflow.mv(filePath);

      res.redirect('/');
    }
  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: <Error>err.message,
    });
  }
});

/**
* Returns a list of all the available workflows.
*/
app.get('/workflow', async (req, res) => {
  if (!fs.existsSync(uploadsDir)) {
    res.json([]);
    return;
  }

  const out = fs.readdirSync(uploadsDir)
    .map((name, idx) => ({
      idx,
      name,
      params: SWInterpret.getParams(
        JSON.parse(fs.readFileSync(path.join(uploadsDir, name)).toString()),
      ),
    }));
  res.json(out);
});

/**
* Runs the specified workflow and returns a URL for looking inside.
*/
app.post('/performer', async (req, res) => {
// The interpreter runs the workflow as soon as the client connects to it.
  try {
    const workflows = fs.readdirSync(uploadsDir);
    const { id, params } = req.body;

    if (id === undefined || !workflows[id]) {
      throw new Error('Nonexistent workflow.');
    }
    // If the specified workflow exists, we set up the performer and assign an URL to it.
    const url = crypto.randomBytes(8).toString('hex');

    const performer = new Performer(
      JSON.parse(fs.readFileSync(
        path.join(uploadsDir, workflows[id]),
      ).toString()).workflow, params, <any>io.of(url),
    );

    console.debug(`Set up a performer on ${url}`);

    performers.push(performer);

    res.json({
      status: true,
      message: 'Performer added.',
      url,
    });
  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: <Error>err.message,
    });
  }
});

app.get('/performer', async (req, res) => {
// The interpreter runs the workflow as soon as the client connects to it.
  try {
    res.json(performers.map((x, idx) => ({ id: idx, url: x.url, state: x.state })));
  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: <Error>err.message,
    });
  }
});

app.get('/performer/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/runner.html'));
});

app.use(express.static(path.join(__dirname, '../public')));
// start app
const port = process.env.APIFY_CONTAINER_PORT || 3000;

server.listen(port, () => {
  console.log('listening on localhost:3000');
  setInterval(() => {
    if (!performers.some((x) => x.state === 'OCCUPIED')) {
      console.debug('No performers running, turning off...');
      process.exit(0);
    }
  }, 5 * 60 * 1000);
});
