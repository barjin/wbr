/**
 * HTTP server for the cloud SW interpreter interface.
 * Implements RESTful API endpoints for workflow and performer management.
*/
import express from 'express';
import cors from 'cors';
import fileUpload, { UploadedFile } from 'express-fileupload';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import socket from 'socket.io';
import http from 'http';
import { Preprocessor } from '@wbr-project/wbr-interpret';
import Performer from './performer';

const app = express();
const uploadsDir = 'uploads';

const performers : Performer[] = [];

app.use(fileUpload({
  createParentPath: true,
}));

app.use(cors());
app.use(express.json());

/**
 * Object of the HTTP Express server.
 */
const server = http.createServer(app);
/**
 * Object of the Socket.io server.
 */
const io = new socket.Server(server, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

/**
 * `POST` method for the `/workflow` endpoint
 * Uploads a new workflow as a file. Tests if the file is a valid JSON.
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

      // Throws if workflow is not valid JSON
      JSON.parse(workflow.data.toString());
      // TODO: better parsing (check if the file is a valid workflow?)

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
* `GET` method for the `/workflow` endpoint
* Returns a list of all the available workflows.
*/
app.get('/workflow', async (req, res) => {
  if (!fs.existsSync(uploadsDir)) {
    res.json([]);
    return;
  }

  const out = fs.readdirSync(uploadsDir)
    .map((filename, idx) => ({
      idx,
      filename,
      ...(() => {
        const file = JSON.parse(fs.readFileSync(path.join(uploadsDir, filename)).toString());
        return ({
          cname: file.meta.name,
          params: Preprocessor.getParams(file),
        });
      })(),
    }));
  res.json(out);
});

/**
* `POST` method for the `/performer` endpoint
*
* Runs the specified workflow and returns a URL for looking inside.
*/
app.post('/performer', async (req, res) => {
// The interpreter runs the workflow as soon as the client connects to it.
  try {
    const { workflow, params } = req.body;

    console.log(req.body);

    if (Preprocessor.validateWorkflow(workflow)) {
      console.error(Preprocessor.validateWorkflow(workflow));
      throw new Error('Invalid workflow.');
    }
    // If the workflow is valid, we set up the performer and assign an URL to it.
    const url = crypto.randomBytes(8).toString('hex');

    const performer = new Performer(workflow, <any>io.of(url));

    console.debug(`Set up a performer on ${url}`);

    performers.push(performer);
    performer.run(params);

    res.json({
      status: true,
      message: 'Performer started.',
      url,
    });
  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: <Error>err.message,
    });
  }
});

/**
 * `GET` method for the `/performer` endpoint
 *
 * Returns a list of currently existing performers with their names, urls and states.
 */
app.get('/performer', async (req, res) => {
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

app.get('/performer/:id/stop', async (req, res) => {
  try {
    await performers.find((x) => x.url === `/${req.params.id}`)!.stop();
    res.sendStatus(204);
    res.end();
  } catch (err: any) {
    res.status(500).json({
      status: false,
      message: <Error>err.message,
    });
  }
});

app.use(express.static(path.join(__dirname, '../public')));

/**
 * Port to run the web app on.
 *
 * If `APIFY_CONTAINER_PORT` environment variable is present, it is used instead.
 */
const port = process.env.APIFY_CONTAINER_PORT || 8080;

/**
 * Starts the HTTP server on the given port.
 * Implements a simple idle timer to turn off an idle cloud interpreter.
 */
server.listen(port, () => {
  console.log(`listening on localhost:${port}`);
  // TODO: implement better algorithm for the idle timer (`x` minutes after the last finish?)
  setInterval(() => {
    if (performers.every((x) => x.state !== 'OCCUPIED')) {
      console.debug('No performers running, turning off...');
      process.exit(0);
    }
  }, 5 * 60 * 1000);
});
