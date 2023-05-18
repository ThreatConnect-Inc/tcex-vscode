import * as vscode from 'vscode';
import { AppSpecObserver } from './appSpecWatcher';

import { exec} from 'child_process';

export class TcExStatusBarItem  implements AppSpecObserver {
    private static instance?: TcExStatusBarItem;
    private statusBarItem: vscode.StatusBarItem;
    private depsWatcher: vscode.FileSystemWatcher;
    private tcexVersion?: string;
    private appSpec: any;

    private constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.depsWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.workspaceFolders![0], 'deps/**'));

        this.depsWatcher.onDidChange((uri) => {
            this.loadTcExVersion();
        });

        this.loadTcExVersion();
    }

    private loadTcExVersion() {
        const path = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'deps').fsPath;
        exec(
            `python -c "import sys; sys.path.insert(0, '${path}'); from tcex.__metadata__ import __version__; print(__version__)"`,
            (_error, stdout, _stderr) => {
                if (stdout && /^\d+\.\d+\.\d+$/.test(stdout.trim())) {
                    this.tcexVersion = stdout.trim();
                    this.updateStatusBarItem();
                }
            });
    }

    public onAppSpecChange(appSpec: any): void {
        this.appSpec = appSpec;
        this.updateStatusBarItem();
        this.statusBarItem.show();
    }

    public updateStatusBarItem() {
        this.statusBarItem.text = `$(threatconnect-icon) ${this.appSpec.displayName} (${this.appSpec.programVersion})`;
        this.statusBarItem.command = 'tcex-appbuilder.showAppInfo';
        if (this.tcexVersion) {
            this.statusBarItem.tooltip = `TcEx Version: ${this.tcexVersion}`;
        } else {
            this.statusBarItem.tooltip = 'TcEx Version: N/A (Run "tcex deps" to install dependencies)';
        }
    }

    public static create(): TcExStatusBarItem {
        if (!this.instance) {
            this.instance = new TcExStatusBarItem();
        }

        return this.instance;
    }

    public static dispose() {
        if (this.instance) {
            this.instance.depsWatcher.dispose();
            this.instance.statusBarItem.dispose();
        }
        this.instance = undefined;
    }
}
