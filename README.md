# WTFOS Configurator

> Root and configure your DJI HD FPV goggles and air-units via web interface.

## Deployment

The app is automatically built and deployed to gh-pages. If forking this repository you will have to change the `homepage` property in `package.json` to point to the actual URL you want to use.

## Development

Be aware that the exploit is only available in an obfuscated version. People with the correct permissions can pull in the exploit as a git submodule:

```
git submodule update --init
```

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
