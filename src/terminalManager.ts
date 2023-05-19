import * as vscode from 'vscode';


export class TerminalManager {
    private _terminal?: vscode.Terminal;
    private options: vscode.TerminalOptions;

    constructor(options: vscode.TerminalOptions) {
        this.options = options;

        vscode.window.onDidCloseTerminal((terminal) => {
            if (this._terminal === terminal) {
                this._terminal = undefined;
            }
        });
    }

    withTerminal(): Promise<vscode.Terminal> {
        return new Promise((resolve) => {
            const terminal = this.terminal;
            setTimeout(() => {
                resolve(terminal);
            }, 1500);

        });
    }

    get terminal(): vscode.Terminal {
        if (!this._terminal) {
            this._terminal = vscode.window.createTerminal(this.options);
        }

        return this._terminal;
    }

    public dispose() {
        if (this._terminal) {
            this._terminal.dispose();
        }
        this._terminal = undefined;
    }
}