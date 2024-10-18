import { createServer } from "http";
import { readFile } from "fs";

const PORT = 8080;

createServer((req, res) => {
    const url = req.url == '/' ? '/index.html' : req.url;
    readFile(`.${url}`, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.write('404 Not Found');
            res.end();
            return;
        }

        res.writeHead(200, { 'Content-Type': getMime(url) });
        res.write(data);
        res.end();
    })
}).listen(PORT);

function getMime(fileName) {
    const ext = fileName.split('.').pop().split(/[^a-zA-Z0-9]/).shift();
    switch(ext) {
        case 'htm':
        case 'html': return 'text/html';
        case 'js': return 'text/javascript';
        case 'css': return 'text/css';
        case 'ico': return 'image/vnd.microsoft.icon';
        case 'map':
        case 'json': return 'application/json';
        case 'png': return 'image/png';
    }
    return 'text/plain';
}