import * as vscode from 'vscode';
import { HelloWorldPanel } from "./panels/HelloWorldPanel";

import { findFilesInWorkspace } from './utilities/findFilesInWorkspace';
import { AppSpecWatcher } from './appSpecWatcher';
import { TcExStatusBarItem } from './statusBarItem';
import { TerminalManager } from './terminalManager';

const specToolTerminal = new TerminalManager({
    cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
    iconPath: new vscode.ThemeIcon("threatconnect-icon"),
    name: 'TcEx Spec Tool',
});

export function activate(context: vscode.ExtensionContext) {
    // Register the command
    context.subscriptions.push(vscode.commands.registerCommand('tcex-appbuilder.showAppInfo', () => {
        findFilesInWorkspace('app_spec.yml').then((files) => {
            AppSpecWatcher.register(HelloWorldPanel.render(context.extensionUri));
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('tcex-appbuilder.app_spec.app_spec', () => {
        specToolTerminal.terminal.sendText('tcex spec-tool --app-spec');
        specToolTerminal.terminal.show();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('tcex-appbuilder.app_spec.all', () => {
        specToolTerminal.terminal.sendText('tcex spec-tool --install-json --layout-json --tcex-json');
        specToolTerminal.terminal.show();
    }));

    AppSpecWatcher.register(TcExStatusBarItem.create());
}

export function deactivate() {
    AppSpecWatcher.dispose();
    HelloWorldPanel.dispose();
    TcExStatusBarItem.dispose();
    specToolTerminal.dispose();
}
