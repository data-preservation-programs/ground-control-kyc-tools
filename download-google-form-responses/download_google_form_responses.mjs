import fs from 'fs'
import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import google from '@googleapis/forms'
import { authenticate } from '@google-cloud/local-auth'
import neatCsv from 'neat-csv'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

const formId = process.env.FORM_ID
if (!formId) {
  console.error('Missing FORM_ID!')
  process.exit(1)
}

if (!process.env.CREDENTIALS_JSON) {
  console.error('Missing CREDENTIALS_JSON!')
  process.exit(1)
}

const processedResponseIds = new Set()

async function run () {
  const processedCsv = process.env.PROCESSED_CSV
  if (processedCsv) {
    const csvData = fs.readFileSync(processedCsv, 'utf8')
    const processedRecords = await neatCsv(csvData)
    for (const record of processedRecords) {
      processedResponseIds.add(record.responseId)
    }
  }

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
  // console.log('Form:', JSON.stringify(formResponse.data, null, 2))

  const responses = await forms.forms.responses.list({ formId })
  // console.log('Responses:', JSON.stringify(responses.data, null, 2))

  // Compute column names for output (CSV friendly)
 
  const columns = []
  let page = 0
  for (const item of formResponse.data.items) {
    if (item.pageBreakItem) {
      page++
    } else if (item.questionItem) {
      const titleWords = item.title
        .replace(/\(.*/, '')
        .replace(/-/g, '')
        .replace(/\?/g, '')
        .trim()
        .split(' ')
        .map(word => word.toLowerCase())
        .slice(0, 6)

      const columnName = `${page}_${titleWords.join('_')}`
      columns.push({
        page,
        title: item.title,
        questionId: item.questionItem.question.questionId,
        columnName
      })
    }
  }
  // console.log('Columns:', columns)

  const formattedResponses = []
  for (const response of responses.data.responses) {
    if (processedResponseIds.has(response.responseId)) continue
    const row = {
      responseId: response.responseId,
      timestamp: response.lastSubmittedTime
    }
    const answers = response.answers
    for (const column of columns) {
      const answer = answers[column.questionId]
      if (answer) {
        if (answer.textAnswers) {
          row[column.columnName] = answer.textAnswers.answers[0].value
        }
      }
    }
    formattedResponses.push(row)
  }
  formattedResponses.sort(({ timestamp: a }, { timestamp: b }) => a.localeCompare(b))
  // console.log('Formatted Responses:', formattedResponses)

  fs.mkdirSync('output', { recursive: true })
  fs.writeFileSync('output/google-form-responses.json', JSON.stringify(formattedResponses, null, 2))

  console.log(formattedResponses)
}

run()

