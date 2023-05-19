import * as vscode from 'vscode';
import * as yaml from 'yaml';

import isEqual = require('lodash.isequal');



export interface AppSpecObserver {
    onAppSpecChange(appSpec: any): void;
}

export class AppSpecWatcher implements AppSpecObserver {
    private static instance?: AppSpecWatcher;
    private static readonly appYamlUri: vscode.Uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'app_spec.yml');

    private observers: WeakRef<AppSpecObserver>[] = [];
    private appYamlWatcher: vscode.FileSystemWatcher;
    private _appYaml: any;

    private constructor() {

        vscode.workspace.openTextDocument(AppSpecWatcher.appYamlUri).then((document) => {
            this.appYaml = yaml.parse(document.getText());
            this._regsiter(this, false);
        });

        this.appYamlWatcher = vscode.workspace.createFileSystemWatcher('**/app_spec.yml');

        this.appYamlWatcher.onDidChange((uri) => {
            if (uri.toString() === AppSpecWatcher.appYamlUri.toString()) {
                vscode.workspace.openTextDocument(AppSpecWatcher.appYamlUri).then((document) => {
                    this.appYaml = yaml.parse(document.getText());
                });
            }
        });
        this.appYamlWatcher.onDidDelete((uri) => {
            if (uri.toString() === AppSpecWatcher.appYamlUri.toString()) {
                vscode.workspace.openTextDocument(AppSpecWatcher.appYamlUri).then((document) => {
                    this.appYaml = yaml.parse(document.getText());
                });
            }
        });
        this.appYamlWatcher.onDidCreate((uri) => {
            if (uri.toString() === AppSpecWatcher.appYamlUri.toString()) {
                vscode.workspace.openTextDocument(AppSpecWatcher.appYamlUri).then((document) => {
                    this.appYaml = yaml.parse(document.getText());
                });
            }
        });
    }

    onAppSpecChange(appSpec: any): void {
        const actions = [{ title: 'Regenerate Files', action: 'regenerate' }];
        vscode.window.showInformationMessage(
            'app_spec.yml changed, would you like to regenerate the files?',
            { modal: false } as vscode.MessageOptions,
            ...actions
        ).then((selection) => {
            if (selection === actions[0]) {
                vscode.commands.executeCommand('tcex-appbuilder.app_spec.all');
            }
        });
    }

    private set appYaml(appYaml: any) {
        if (!isEqual(this._appYaml, appYaml)) {
            this._appYaml = appYaml;
            this.notify();
        }
    }

    private get appYaml(): any {
        return this._appYaml;
    }

    private static create(): AppSpecWatcher {
        if (!this.instance) {
            this.instance = new AppSpecWatcher();
        }

        return this.instance;
    }

    public static dispose() {
        if (this.instance) {
            this.instance.appYamlWatcher.dispose();
        }
        this.instance = undefined;
    }

    public static register(observer: AppSpecObserver) {
        const instance = AppSpecWatcher.create();
        instance._regsiter(observer);
    }

    private _regsiter(observer: AppSpecObserver, sendCurrent: boolean = true) {
        this.observers.push(new WeakRef(observer));
        if (this.appYaml && sendCurrent) {
            observer.onAppSpecChange(this.appYaml);
        }
    }

    private notify() {
        this.observers
            .map((observer) => observer.deref())
            .forEach((observer) => {
                if (observer !== undefined) {
                    observer.onAppSpecChange(this.appYaml);
                }
            });

        this.cleanupObservers();
    }

    private cleanupObservers() {
        this.observers = this.observers.filter((observer) => observer.deref() !== undefined);
    }


}
