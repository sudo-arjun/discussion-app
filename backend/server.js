import http from 'http';
import url from 'url';
import path from 'path';
import route from './route.js';
import { promises as fs } from 'fs';
let port  = process.env.PORT || 3005;
const server = http.createServer(reqHandler);

async function reqHandler(req, res) {
    req.url = url.parse(req.url, true);
    const pathname = req.url.pathname;
    const ext = path.extname(pathname);
    // serves static files
    if (ext == '.css' || ext == '.js') {
        let filePath = `../frontend/src${pathname}`
        let file = await fs.readFile(filePath);
        res.setHeader('content-type',`text/${ext.slice(1)}`)
        if(ext == '.js')
            res.setHeader('content-type',`text/javascript`)

        console.log(filePath,`text/${ext.slice(1)}`)
        res.end(file);
    }
    //serves html and /data api
    else if (route[req.url.pathname] && route[req.url.pathname][req.method])
        route[req.url.pathname][req.method](req, res);
    else {
        res.end("404 Page Not Found!");
    }
}

server.listen(port, () => console.log(`server listening at ${port}`))