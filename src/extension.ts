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

    // Register the command
    context.subscriptions.push(vscode.commands.registerCommand(
        'tcex-appbuilder.showAppInfo',
        () => {
            findFilesInWorkspace('app_spec.yml').then((files) => {
                AppSpecWatcher.register(AppBuilderPanel.render(context.extensionUri));
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


    context.subscriptions.push(vscode.commands.registerCommand('tcex-appbuilder.deploy',
        deployCommand(tcexTerminal, vscode.workspace.getConfiguration('tcex').get('deployTarget'))));

    context.subscriptions.push(AppSpecWatcher);
    context.subscriptions.push(AppBuilderPanel);
    context.subscriptions.push(TcExStatusBarItem);
    context.subscriptions.push(tcexTerminal);

    AppSpecWatcher.register(TcExStatusBarItem.create());
}
