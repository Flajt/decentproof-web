# Decentproof Web
This is the code for the [Decentproof App](https://github.com/Flajt/decentproof-app) website.

## Techstack
This is a rather basic stack at the moment since it's not big
- GO
- HTML
- JS
- CSS

## Additional Tech
- mCaptcha, a privacy friendly captcha like service
- cabin analytics, privacy friendly analytics
- mediaInfo a js library to allow the extraction of file metadata

## How To Run
- Make sure you have go installed
- _go_ into the main folder (no pun intended)
- Replace the `serverUrl` either with a hardcoded string or load it as .env var from an .env file with the utility script found in [decentproof-backend](https://github.com/Flajt/decentproof/backend) (it's called `load_env.go`)
- You should be able to run `go run main.go`
- If not make sure to fetch the dependencies

## Structure
- `static`: Contains all files
- `static/imgs`: Contains images to be displayed
<br>
Other files should be self explanatory

## Feedback and Contributions
- For now open issues and other things at the `decentproof-app` repository. Thanks a lot
