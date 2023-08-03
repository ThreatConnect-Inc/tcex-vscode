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

  get terminal(): Thenable<vscode.Terminal> {
    if (!this._terminal) {
      this._terminal = vscode.window.createTerminal(this.options);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this._terminal!);
        }, 1500);
      });
    }

    return new Promise((resolve) => resolve(this._terminal!));
  }

  public dispose() {
    if (this._terminal) {
      this._terminal.dispose();
    }
    this._terminal = undefined;
  }
}
