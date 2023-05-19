import * as vscode from 'vscode';
import { AppSpecObserver } from './appSpecWatcher';

import { exec } from 'child_process';

export class TcExStatusBarItem implements AppSpecObserver {
    private static instance?: TcExStatusBarItem;
    private statusBarItem: vscode.StatusBarItem;
    // private depsWatcher: vscode.FileSystemWatcher;
    private tcexVersion?: string;
    private appSpec: any;
    private disposables: vscode.Disposable[] = [];

    private constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

        this.disposables.push(this.statusBarItem);

        this.disposables.push(vscode.workspace.onDidChangeConfiguration((e) => {
            this.updateStatusBarItem();
        }));

        setInterval(() => this.loadTcExVersion(), 30_000);  // check every 30 seconds.
    }

    private loadTcExVersion() {
        const path = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'deps').fsPath;
        exec(
            `python -c "import sys; sys.path.insert(0, '${path}'); from tcex.__metadata__ import __version__; print(__version__)"`,
            (_error, stdout, _stderr) => {
                if (stdout && /^\d+\.\d+\.\d+$/.test(stdout.trim())) {
                    this.tcexVersion = stdout.trim();
                } else {
                    this.tcexVersion = undefined;
                }
                this.updateStatusBarItem();
            });
    }

    public onAppSpecChange(appSpec: any): void {
        this.appSpec = appSpec;
        if (this.appSpec) {
            this.updateStatusBarItem();
            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }

    }

    public updateStatusBarItem() {
        this.statusBarItem.text = `$(threatconnect-icon)${this.appSpec.displayName} (${this.appSpec.programVersion})`;
        const tooltip = new vscode.MarkdownString();

        if (!this.tcexVersion) {
            tooltip.appendMarkdown('$(alert)No tcex found.  [Install](command:tcex-appbuilder.deps) dependencies.\n\n');
        }
        if (this.tcexVersion) {
            tooltip.appendMarkdown(`App TcEx Version: ${this.tcexVersion}\n\n`);
        }
        tooltip.appendMarkdown('\n\n\n\n---\n\n');
        tooltip.appendMarkdown('[$(debug-start)Install App Dependencies](command:tcex-appbuilder.deps)\n\n');
        tooltip.appendMarkdown('[$(debug-start)Package App](command:tcex-appbuilder.package)\n\n');
        tooltip.appendMarkdown('[$(debug-start)Regenerate All Files](command:tcex-appbuilder.app_spec.all)\n\n');
        if (vscode.workspace.getConfiguration('tcex').get('enableDeploy')) {
            tooltip.appendMarkdown('[$(debug-start)Deploy App](command:tcex-appbuilder.deploy)\n\n');

        }


        tooltip.isTrusted = true;
        tooltip.supportThemeIcons = true;

        this.statusBarItem.tooltip = tooltip;
        this.statusBarItem.command = 'tcex-appbuilder.showAppInfo';
        this.statusBarItem.backgroundColor = undefined;

        if (!this.appSpec || !this.tcexVersion) {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
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
            for (const disposable of this.instance.disposables) {
                disposable.dispose();
            }
        }
        this.instance = undefined;
    }
}
