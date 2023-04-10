# WTFOS Configurator

> Root and configure your DJI HD FPV goggles and air-units via web interface.

## Deployment

The app is automatically built and deployed to gh-pages. If forking this repository you will have to change the `homepage` property in `package.json` to point to the actual URL you want to use.

## Development

### dotenv
For ease of development a `.env.example` file is available, simply copy it to `.env` to enable it. This will set up a couple of env variables thata will be useful for local developent like for example the CORS proxy for rooting.

### Translations
If you want the configurator to be available in your language drop my on [discord](https://discord.com/invite/3rpnBBJKtU) and tell us which language you want to add, or contribute translations to available langues on [crowdin](https://crowdin.com/project/wtfos-configurator).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.
You may also see any lint errors in the console.

### `yarn run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
Your app is ready to be deployed!

## Reverse-Shell to device

In the project directory, run:

### `yarn device-shell`

This will spawn a reverse-shell-server on port `8000`.
you can change the port by passing `-p PORT` or `--port PORT`

After that, head over to the CLI-Tab, expand the "Reverse Shell"-card and connect.
You will now have a shell on your device from your regular terminal.

The shell is "persistent" when navigating the configurator as long as you don't refresh the page.
The web-based shell and the reverse-shell are synced.

Press Ctrl+D in the reverse-shell to disconnect and exit.

Sources for the reverse-shell-server can be found [here](https://github.com/Alia5/wtfos-configurator-reverse-shell-server)
