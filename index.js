//#region nds
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { format } from 'prettier';
class NDSError extends Error {
	constructor(message) {
		super(message);
		this.name = 'NDSError';
	}
	setCode(code) {
		this.code = code;
		return this;
	}
}
class NDSData {
	constructor(json) {
		this.key = json.key;
		this.value = json.value;
	}
	toJSONString() {
		return JSON.stringify({
			key: this.key,
			value: this.value,
		});
	}
	toString() {
		return this.toJSONString();
	}
}
const GetSync = (regexp = /[\s\S]*/, file = '.ndsf') => {
	if (!(regexp instanceof RegExp))
		throw new NDSError(`Invalid RegExp: ${regexp}`).setCode(101);
	if (!existsSync(file) || !file.match(/\.ndsf$/))
		throw new NDSError(`Invalid file: '${file}'`).setCode(201);
	let allJson = [],
		allData = [],
		allHits = [],
		json;
	try {
		json = JSON.parse(readFileSync(file, { encoding: 'utf-8' }));
	} catch (e) {
		throw new NDSError(`Content of ${file} is invalid JSON`).setCode(202);
	}
	for (let i in json) {
		allJson.push(json[i]);
	}

	allJson.sort((a, b) => {
		a = a.key.toString().toLowerCase();
		b = b.key.toString().toLowerCase();
		return a < b ? -1 : a > b ? 1 : 0;
	});

	allHits = allJson.filter((value) => {
		return regexp.test(value.key) ? true : false;
	});

	allHits.forEach((value) => {
		allData.push(new NDSData(value));
	});

	return allData;
};
const SetSync = (data = new NDSData(), file = '.ndsf') => {
	if (!(data instanceof NDSData) || !data.key || !data.value)
		throw new NDSError(`Invalid data: ${data}`).setCode(102);
	if (!existsSync(file) || !file.match(/\.ndsf$/))
		throw new NDSError(`Invalid file: '${file}'`).setCode(201);
	let allJson = [],
		allData = GetSync(/.*/i, file);
	allData.push(data);
	allData.forEach((value) => {
		allJson.push(
			format(value.toJSONString(), {
				parser: 'json-stringify',
				useTabs: true,
			})
		);
	});
	writeFileSync(
		file,
		format(`[\n${allJson.join(',\n')}\n]`, {
			parser: 'json-stringify',
			useTabs: true,
		}),
		{ encoding: 'utf-8' }
	);
	return GetSync(/[\s\S]*/, file);
};
//#endregion nds

import express from 'express';
const app = express();

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/form.html');
});

app.get('/handle', (req, res) => {
	SetSync(
		new NDSData({
			key: Date.now().toString(),
			value: req.query.txt.toString(),
		}),
		'./log.ndsf'
	);
	res.status(200);
	res.redirect('/');
	res.end();
});

app.get('/api/getlog', (req, res) => {
	res.send(GetSync(/[\s\S]*/, './log.ndsf'));
});

app.listen(8000);
