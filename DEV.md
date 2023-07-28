# Setup

npm install -g @vscode/vsce
cd webview-ui
npm install
ng build --output-hashing=none
cd ..
vsce package
