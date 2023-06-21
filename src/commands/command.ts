import * as vscode from 'vscode';

import { TerminalManager } from "../terminalManager";

export function terminalCommand(command: string, terminalManager: TerminalManager): () => Thenable<void> {
    return () => {
        return new Promise((resolve, reject) => {
            terminalManager.terminal.then(
                (terminal) => {
                    terminal.sendText(command);
                    terminal.show();
                    resolve();
                },
                (err) => reject(err));
        });
    };
}

export function deployCommand(terminalManager: TerminalManager, defaultDeployTarget?: string): () => Thenable<void> {
    let _defaultDeployTarget = defaultDeployTarget;
    return () => {
        return vscode.window.showInputBox(
            {
                title: 'Enter ThreatConnect Deploy Target',
                value: _defaultDeployTarget
            }).then((value) => {
                return new Promise((resolve, reject) => {

                    if (value) {
                        _defaultDeployTarget = value;
                        terminalManager.terminal.then(
                            (terminal) => {
                                terminal.sendText(`tcex deploy ${_defaultDeployTarget}`);
                                terminal.show();
                                resolve();
                            },
                            (err) => reject(err));
                    } else {
                        reject('No deploy target specified');
                    }
                });
            });
    };
}
