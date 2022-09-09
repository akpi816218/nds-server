import express from 'express';
const app = express();
import { readFileSync, writeFileSync } from 'fs';
import { format } from 'prettier';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const allowedPaths = [
	'/',
	'/api/getlog/formatted',
	'/api/getlog/raw',
	'/handle',
];

app.use((req, res, next) => {
	if (!allowedPaths.includes(req.originalUrl)) {
		console.log(`ERROR 404 - ${req.ip} - ${req.method} ${req.originalUrl}`);
		res
			.status(404)
			.send(`HTTP`)
			.sendFile(__dirname + '/404.html');
		return;
	}
	console.log(`${req.ip} - ${req.method} ${req.originalUrl}`);
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
		res.status(200).redirect('/').end();
	} catch (e) {
		res.status(406).redirect('/').end();
	}
});

app.get('/api/getlog/raw', (req, res) => {
	res
		.status(200)
		.set('Content-Type', 'text/plain')
		.send(
			readFileSync('./log.ndsf', { encoding: 'utf-8' })
			// .toString()
			// .replace(/\s/g, '')
		)
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

app.listen(8000);
