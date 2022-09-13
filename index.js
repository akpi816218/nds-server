import express from 'express';
const app = express();
import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { format } from 'prettier';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const allowed = {
	paths: [
		'/',
		'/api/getlog/formatted',
		'/api/getlog/raw',
		'/handle',
		'/tmp'
	],
	methods: [
		'GET'
	],
};

app.use((req, res, next) => {
	if (!allowed.paths.includes(req.path) || !allowed.methods.includes(req.method)) {
		appendFileSync('server.log', `\nERROR 404 - ${req.ip} - ${req.method} ${req.path}`);
		res
			.status(404)
			.send(`HTTP ERROR 404:
Cannot ${req.method} '${req.path}'
`)
		return;
	}
	console.log(`${req.ip} - ${req.method} ${req.path}`);
	next();
});

app.get('/', (req, res) => {
	res.status(200).sendFile(__dirname + '/form.html');
});

app.get('/handle', (req, res) => {
	if (!req.query.txt) {
		res.status(406).redirect('/').end();
		return;
	}
	try {
		let content = readFileSync('./log.ndsf')
			.toString()
			.replace('[', '')
			.replace(']', '');
		let text = '[' + content + `,"${req.query.txt.toString()}",]`;
		text = format(text, {
			parser: 'json-stringify',
			tabWidth: 2,
			useTabs: true,
			trailingComma: 'none',
		});
		writeFileSync('./log.ndsf', text);
		res.status(200).redirect('/');
	} catch (e) {
		res.status(406).redirect('/');
	}
});

app.get('/api/getlog/raw', (req, res) => {
	res
		.status(200)
		.set('Content-Type', 'text/plain')
		.send(readFileSync('./log.ndsf', { encoding: 'utf-8' }))
		.end();
});

app.get('/api/getlog/formatted', (req, res) => {
	let str = format(readFileSync('./log.ndsf').toString(), {
		parser: 'json-stringify',
		useTabs: true,
		tabWidth: 2,
		trailingComma: 'none',
	});
	res.status(200).end(str);
});

// '/tmp' path is reserved for temporary stuff
app.get('/tmp', (req, res) => {
	res.status(200).end();
});

app.listen(8000);
console.log('Listening at port 8000')