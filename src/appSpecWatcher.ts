import * as vscode from 'vscode';
import * as yaml from 'yaml';


export interface AppSpecObserver {
    onAppSpecChange(appSpec: any): void;
}

export class AppSpecWatcher {
    private static instance?: AppSpecWatcher;
    private static readonly  appYamlUri: vscode.Uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, 'app_spec.yml');

    private observers: WeakRef<AppSpecObserver>[] = [];
    private appYamlWatcher: vscode.FileSystemWatcher;
    private appYaml: any;

    private constructor() {

        vscode.workspace.openTextDocument(AppSpecWatcher.appYamlUri).then((document) => {
            this.appYaml = yaml.parse(document.getText());
            this.notify();
        });

        this.appYamlWatcher = vscode.workspace.createFileSystemWatcher('**/app_spec.yml');

        this.appYamlWatcher.onDidChange((uri) => {
            if (uri.toString() === AppSpecWatcher.appYamlUri.toString()) {
                vscode.workspace.openTextDocument(AppSpecWatcher.appYamlUri).then((document) => {
                    this.appYaml = yaml.parse(document.getText());
                    this.notify();
                });

                const actions = [{ title: 'Regenerate Files', action: 'regenerate'}];
                vscode.window.showInformationMessage(
                    'app_spec.yml changed',
                    { modal: true } as vscode.MessageOptions,
                    ...actions
                    ).then((selection) => {
                        if (selection === actions[0]) {
                            vscode.commands.executeCommand('tcex-appbuilder.app_spec.all');
                        }
                    });
            }
        });
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

    private _regsiter(observer: AppSpecObserver) {
        this.observers.push(new WeakRef(observer));
        if (this.appYaml){
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
