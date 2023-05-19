import * as vscode from 'vscode';
import { AppBuilderPanel } from "./panels/AppBuilderPanel";

import { findFilesInWorkspace } from './utilities/findFilesInWorkspace';
import { AppSpecWatcher } from './appSpecWatcher';
import { TcExStatusBarItem } from './statusBarItem';
import { TerminalManager } from './terminalManager';


export function activate(context: vscode.ExtensionContext) {
    const specToolTerminal = new TerminalManager({
        cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
        name: '$(threatconnect-icon)TcEx',
    });

    // see if we have an app_spec and if we don't, prompt user to generate it.
    findFilesInWorkspace('app_spec.yml').then((files) => {
        if (files.length === 0) {
            const actions = [{ title: 'Yes', action: 'generate' }];

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
    context.subscriptions.push(vscode.commands.registerCommand(
        'tcex-appbuilder.showAppInfo',
        () => {
            findFilesInWorkspace('app_spec.yml').then((files) => {
                AppSpecWatcher.register(AppBuilderPanel.render(context.extensionUri));
            });
        }));

    context.subscriptions.push(vscode.commands.registerCommand('tcex-appbuilder.app_spec.app_spec', () => {
        specToolTerminal.withTerminal().then((terminal) => {
            terminal.sendText('tcex spec-tool --app-spec');
            terminal.show();
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('tcex-appbuilder.app_spec.all', () => {
        specToolTerminal.withTerminal().then((terminal) => {
            terminal.sendText('tcex spec-tool --install-json --layout-json --tcex-json');
            terminal.show();
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('tcex-appbuilder.deps', () => {
        specToolTerminal.withTerminal().then((terminal) => {
            terminal.sendText('tcex deps');
            terminal.show();
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('tcex-appbuilder.package', () => {
        specToolTerminal.withTerminal().then((terminal) => {
            terminal.sendText(`tcex package`);
            terminal.show();
        });
    }));


    let lastDeployTarget: string;

    context.subscriptions.push(vscode.commands.registerCommand('tcex-appbuilder.deploy', () => {
        vscode.window.showInputBox(
            {
                title: 'Enter ThreatConnect Deploy Target',
                value: lastDeployTarget
            }).then((value) => {
                if (value) {
                    lastDeployTarget = value;
                    specToolTerminal.withTerminal().then((terminal) => {
                        terminal.sendText(`tcex deploy ${lastDeployTarget}`);
                        terminal.show();
                    });
                }
            });
    }));

    context.subscriptions.push(AppSpecWatcher);
    context.subscriptions.push(AppBuilderPanel);
    context.subscriptions.push(TcExStatusBarItem);
    context.subscriptions.push(specToolTerminal);

    AppSpecWatcher.register(TcExStatusBarItem.create());
}
