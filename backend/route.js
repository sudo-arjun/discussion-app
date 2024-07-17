// const indexHtmlFile = require('../frontend/src/index.html');
// const file = require('file').promises;
import { promises as fs } from 'fs';
const htmlFilePath =  '../frontend/src/index.html'
const dataPath = './data.json';
const route = {
    '/' : {
        'GET' : async (req,res)=>{
            res.setHeader('content-type','text/html');
            let file = await fs.readFile(htmlFilePath);
            res.end(file);
        }
    },
    '/data':{
        'POST' : async (req,res)=>{
            let dataStr = '';
            req.on('data',(chunks)=>{
                dataStr += chunks;
            })
            req.on('end',async ()=>{
                //save the dataStr
                await fs.writeFile(dataPath,dataStr);
                res.end("saved");
            })
        },
        'GET' : async(req,res) => { 
            res.setHeader('content-type','text');
            let dataStr = await fs.readFile(dataPath);
            res.end(dataStr);
        }
    }
}

export default route;