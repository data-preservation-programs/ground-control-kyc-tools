ground-control-kyc-tools
===

Retrieves responses Google Form, checks them for validity, and syncs to a CSV file.

This contains a Node.js CLI application intended to be run from a GitHub
Action. It downloads Google Form answers from the SP application.

The overall Ground Control project does the following:
* Retrieves responses from a Google Form
* Loads state from a JSON file
* Compares responses against state to find new responses
* For each new response, execute a command to validate the response,
  passing in the data from the response
  * If it passes, add an entry to add to the output CSV file
  * If it fails, create a GitHub issue with the details
* Write out the state to the JSON file

## Credentials

The CREDENTIALS_JSON environment variable (stored as a GitHub secret) should
contain the contents of a credentials.json file (Base64 encoded) from the Google Cloud console
with permissions to access the Google Drive and Google Forms API. The service
account email should also be added as a collaborator on the Google Form.

* https://medium.com/@a.marenkov/how-to-get-credentials-for-google-sheets-456b7e88c430

## License

MIT/Apache-2 (Permissive License Stack)

