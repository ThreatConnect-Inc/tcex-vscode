import * as vscode from 'vscode';
import { AppBuilderPanel } from "./panels/AppBuilderPanel";

import { findFilesInWorkspace } from './utilities/findFilesInWorkspace';
import { AppSpecWatcher } from './appSpecWatcher';
import { TcExStatusBarItem } from './statusBarItem';
import { TerminalManager } from './terminalManager';
import { deployCommand, terminalCommand } from './commands/command';


export function activate(context: vscode.ExtensionContext) {
    const tcexTerminal = new TerminalManager({
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

    findFilesInWorkspace('app_inputs.json').then((files) => {
        vscode.commands.executeCommand('setContext', 'tcex.appInputsJsonExists', files.length !== 0);
    });

    const appInputJsonWatcher = vscode.workspace.createFileSystemWatcher('**/app_inputs.json');

    appInputJsonWatcher.onDidDelete(() => {
        vscode.commands.executeCommand('setContext', 'tcex.appInputsJsonExists', false);
    });

    appInputJsonWatcher.onDidCreate(() => {
        vscode.commands.executeCommand('setContext', 'tcex.appInputsJsonExists', true);
    });

    context.subscriptions.push(appInputJsonWatcher);

    // Register the commands
    context.subscriptions.push(vscode.commands.registerCommand(
        'tcex-appbuilder.showAppInfo',
        () => {
            findFilesInWorkspace('app_spec.yml').then((files) => {
                AppSpecWatcher.register(AppBuilderPanel.render(context.extensionUri));
            });
        }));

    context.subscriptions.push(vscode.commands.registerCommand(
        'tcex-appbuilder.listCommands',
        () => {
            vscode.window.showQuickPick(
                [
                    'TcEx: Install App Dependencies',
                    'TcEx: Package App',
                    'TcEx: Generate All',
                    'TcEx: Show App Info',
                ]).then((selection) => {
                    switch (selection) {
                        case 'TcEx: Install App Dependencies':
                            vscode.commands.executeCommand('tcex-appbuilder.deps');
                            break;
                        case 'TcEx: Package App':
                            vscode.commands.executeCommand('tcex-appbuilder.package');
                            break;
                        case 'TcEx: Generate All':
                            vscode.commands.executeCommand('tcex-appbuilder.app_spec.all');
                            break;
                        case 'TcEx: Show App Info':
                            vscode.commands.executeCommand('tcex-appbuilder.showAppInfo');
                            break;
                    }
                });
        }));

    context.subscriptions.push(vscode.commands.registerCommand(
        'tcex-appbuilder.app_spec.app_spec',
        terminalCommand('tcex spec-tool --app-spec', tcexTerminal)));

    context.subscriptions.push(vscode.commands.registerCommand(
        'tcex-appbuilder.app_spec.all',
        terminalCommand(
            'tcex spec-tool --install-json --layout-json --tcex-json',
            tcexTerminal)));


    context.subscriptions.push(vscode.commands.registerCommand(
        'tcex-appbuilder.deps',
        terminalCommand(
            'tcex deps',
            tcexTerminal)));


    context.subscriptions.push(vscode.commands.registerCommand(
        'tcex-appbuilder.package',
        terminalCommand(
            'tcex package',
            tcexTerminal)));

    context.subscriptions.push(vscode.commands.registerCommand(
        'tcex-appbuilder.run',
        terminalCommand(
            'tcex run',
            tcexTerminal)));


    context.subscriptions.push(vscode.commands.registerCommand('tcex-appbuilder.deploy',
        deployCommand(tcexTerminal, vscode.workspace.getConfiguration('tcex').get('deployTarget'))));

    context.subscriptions.push(AppSpecWatcher);
    context.subscriptions.push(AppBuilderPanel);
    context.subscriptions.push(TcExStatusBarItem);
    context.subscriptions.push(tcexTerminal);

    AppSpecWatcher.register(TcExStatusBarItem.create());
}
