// const http = require('http');
// const process = require('process')
// const route = require('./route.js')
import http from 'http';
import url from 'url';
import path from 'path';
import route from './route.js';
import { promises as fs } from 'fs';
const server = http.createServer(reqHandler);

async function reqHandler(req, res) {
    req.url = url.parse(req.url, true);
    const pathname = req.url.pathname;
    const ext = path.extname(pathname);
    // console.log(req.url);
    // console.log(pathname, ext);
    if (ext == '.css' || ext == '.js') {
        let filePath = `../frontend/src${pathname}`
        let file = await fs.readFile(filePath);
        res.setHeader('content-type',`text/${ext.slice(1)}`)
        if(ext == '.js')
            res.setHeader('content-type',`text/javascript`)

        console.log(filePath,`text/${ext.slice(1)}`)
        res.end(file);
    }
    else if (route[req.url.pathname] && route[req.url.pathname][req.method])
        route[req.url.pathname][req.method](req, res);
    else {
        res.end("404 Page Not Found!");
    }
}

server.listen(3005, () => console.log("server listening at 3005"));