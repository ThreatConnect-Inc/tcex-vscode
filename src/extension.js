"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const HelloWorldPanel_1 = require("./panels/HelloWorldPanel");
function activate(context) {
    const helloCommand = vscode.commands.registerCommand("hello-world.showHelloWorld", () => {
        HelloWorldPanel_1.HelloWorldPanel.render();
    });
    context.subscriptions.push(helloCommand);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map