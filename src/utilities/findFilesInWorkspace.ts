import { error } from 'console';
import * as vscode from 'vscode';


export function findFilesInWorkspace(pattern: string): Thenable<vscode.Uri[]> {

    return new Promise((resolve, reject) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            // Match any TypeScript file in the root of this workspace folder
            const appSpecPattern = new vscode.RelativePattern(workspaceFolder, pattern);
            vscode.workspace.findFiles(appSpecPattern).then((files) => {
                resolve(files);
            }, (error) => reject(error));
        }
    });

}
