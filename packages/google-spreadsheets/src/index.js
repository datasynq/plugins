import { promises } from 'fs'
const { stat, readFile, writeFile } = promises
import { join } from 'path'
import { EOL } from 'os'
import readline from 'readline'
import { google } from 'googleapis'
import { blueBright } from 'ansi-colors'

let _client_id
let _client_secret
let _redirect_uri

// TODO: this could probably be a class initializer w/ `this`
export const init = async(client_id, client_secret, redirect_uri) => {
	_client_id = client_id
	_client_secret = client_secret
	_redirect_uri = redirect_uri
}

export const get_range = async(spreadsheetId, range) => {
	const auth = await authenticate()
	const sheets = google.sheets({ version: 'v4', auth })
	const res = await new Promise(solve => sheets.spreadsheets.values.get(
		{ spreadsheetId, range },
		(err, res) => solve(res),
	))
	return res.data.values
}

async function authenticate() {
	// SEE: https://developers.google.com/sheets/api/quickstart/nodejs
	const oauth2_client = new google.auth.OAuth2(_client_id, _client_secret, _redirect_uri)

	let token
	// FIXME: how do we figure out this path from the CLI?????????
	const token_path = join(process.cwd(), '__synq__/databases/main/.cache/token.json')
	try { token = await stat(token_path) }
	catch (error) {/* no op */} // eslint-disable-line

	let create_token = true
	if (token && token.isFile()) {
		token = JSON.parse(await readFile(token_path, 'utf-8'))
		// TODO: check if token has expired
		create_token = false
	}

	if (create_token) {
		const authUrl = oauth2_client.generateAuthUrl({
			access_type: 'offline',
			scope: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
		})
		console.log('Authorize this app by visiting this url:', authUrl)
		console.log()
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
		const code = await new Promise(solve => rl.question('Enter the code from that page here: ', solve))
		rl.close()

		const token = await new Promise(solve => oauth2_client.getToken(code, (err, token) => solve(token)))
		console.log(blueBright(' --> generated token:'))
		await writeFile(token_path, JSON.stringify(token, null, '\t') + EOL, 'utf-8')
	}

	oauth2_client.setCredentials(token)
	console.log(blueBright(' --> Authenticated'))

	return oauth2_client
}