import * as vscode from 'vscode';
import { AppBuilderPanel } from "./panels/AppBuilderPanel";

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
    // see if we have an app_spec and if we don't, prompt user to generate it.
    findFilesInWorkspace('app_spec.yml').then((files) => {
        if (files.length === 0) {
            const actions = [{ title: 'Yes', action: 'generate'}];

            vscode.window.showInformationMessage(
                'No app_spec.yml found. Would you like to generate one?',
                { modal: false } as vscode.MessageOptions,
                ...actions
                ).then((selection) => {
                    if (selection === actions[0]) {
                        vscode.commands.executeCommand('tcex-appbuilder.app_spec.app_spec');
                    }
                });
        }
    });

    // Register the command
    context.subscriptions.push(vscode.commands.registerCommand('tcex-appbuilder.showAppInfo', () => {
        findFilesInWorkspace('app_spec.yml').then((files) => {
            AppSpecWatcher.register(AppBuilderPanel.render(context.extensionUri));
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
    AppBuilderPanel.dispose();
    TcExStatusBarItem.dispose();
    specToolTerminal.dispose();
}
