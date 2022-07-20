import fs from 'fs'
import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import google from '@googleapis/forms'
import { authenticate } from '@google-cloud/local-auth'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

const formId = '1z0Ja5VidknDfngLkbAr10Z20VaKZPf2q4n5x6Bgm5v8'

if (!process.env.CREDENTIALS_JSON) {
  console.error('Missing CREDENTIALS_JSON!')
  process.exit(1)
}

async function run () {
  const keyFile = path.join(__dirname, 'credentials.json')
  const credentialsJsonData = Buffer.from(process.env.CREDENTIALS_JSON, 'base64')
  fs.writeFileSync(keyFile, credentialsJsonData)

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: [
      'https://www.googleapis.com/auth/forms.body.readonly',
      'https://www.googleapis.com/auth/forms.responses.readonly'
    ]
  })

  const forms = google.forms({
    version: 'v1',
    auth: auth,
  })

  const formResponse = await forms.forms.get({ formId })
  console.log('Form:', JSON.stringify(formResponse.data, null, 2))

  const responses = await forms.forms.responses.list({ formId })
  console.log('Responses:', JSON.stringify(responses.data, null, 2))
}

run()

