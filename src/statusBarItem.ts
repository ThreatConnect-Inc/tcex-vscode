import * as vscode from 'vscode';
import { AppSpecObserver } from './appSpecWatcher';

import { exec } from 'child_process';

export class TcExStatusBarItem implements AppSpecObserver {
    private static instance?: TcExStatusBarItem;
    private statusBarItemApp: vscode.StatusBarItem;
    private statusBarItemLogo: vscode.StatusBarItem;

    // private depsWatcher: vscode.FileSystemWatcher;
    private tcexVersion?: string;
    private appSpec: any;
    private disposables: vscode.Disposable[] = [];

    private constructor() {
        this.statusBarItemApp = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItemLogo = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

        this.statusBarItemLogo.text = '$(threatconnect-icon)';
        this.statusBarItemLogo.command = 'tcex-appbuilder.listCommands';
        this.statusBarItemLogo.show();

        this.disposables.push(this.statusBarItemApp);
        this.disposables.push(this.statusBarItemLogo);

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
            this.statusBarItemApp.show();
        } else {
            this.statusBarItemApp.hide();
        }

    }

    public updateStatusBarItem() {
        this.statusBarItemApp.text = `${this.appSpec.displayName} (${this.appSpec.programVersion})`;
        const tooltip = new vscode.MarkdownString();

        if (!this.tcexVersion) {
            tooltip.appendMarkdown('$(alert)No tcex found.  [Install](command:tcex-appbuilder.deps) dependencies.\n\n');
        }
        if (!this.appSpec) {
            tooltip.appendMarkdown('$(alert)No app_spec found.  [Generate](command:tcex-appbuilder.app_spec.app_spec) app_spec.\n\n');
        }
        if (this.tcexVersion) {
            tooltip.appendMarkdown(`App TcEx Version: ${this.tcexVersion}\n\n`);
        }
        // tooltip.appendMarkdown('\n\n\n\n---\n\n');
        // tooltip.appendMarkdown('[$(debug-start)Install App Dependencies](command:tcex-appbuilder.deps)\n\n');
        // tooltip.appendMarkdown('[$(debug-start)Package App](command:tcex-appbuilder.package)\n\n');
        // tooltip.appendMarkdown('[$(debug-start)Regenerate All Files](command:tcex-appbuilder.app_spec.all)\n\n');
        // if (vscode.workspace.getConfiguration('tcex').get('enableDeploy')) {
        //     tooltip.appendMarkdown('[$(debug-start)Deploy App](command:tcex-appbuilder.deploy)\n\n');

        // }


        tooltip.isTrusted = true;
        tooltip.supportThemeIcons = true;

        this.statusBarItemApp.tooltip = tooltip;
        this.statusBarItemApp.command = 'tcex-appbuilder.showAppInfo';
        this.statusBarItemApp.backgroundColor = undefined;

        if (!this.appSpec || !this.tcexVersion) {
            this.statusBarItemApp.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
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
