// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import axios from 'axios';
import { exec } from 'child_process';


function getTemplates(type: string): Thenable<string[]> {
	// TODO add base_url and branch to config
	const branch = 'main';
	const baseUrl = 'https://api.github.com/repos/ThreatConnect-Inc/tcex-app-templates';
	const url = `${baseUrl}/contents/${type}`;

	const returnable: Promise<string[]> = new Promise((resolve, reject) => {
		axios.get(url, {params: {ref: branch}})
		.then((response) => {
			resolve(response.data.filter((e: any) => e.type === 'dir').map((e: any) => e.name));
		})
		.catch((error?: any) => reject(error));
	});

	return returnable;
}

type RunCommandError = any | void;

function runCommand(cmd: string, title: string, out: vscode.OutputChannel, cwd?: string, clearOut=true): Thenable<RunCommandError> {
	cwd = cwd ? cwd : (vscode.workspace.workspaceFolders || [])[0].uri.path;
	if (clearOut) { out.clear(); }
    const preRun = vscode.workspace.getConfiguration('threatconnect').get('runBeforeCommands');
	return vscode.window.withProgress(
		{
			cancellable: false,
			location: vscode.ProgressLocation.Window,
			title: title,
		}, (progess, token) => new Promise(
			(resolve, _) => {
                const child = exec(`${preRun}; ${cmd}`, {cwd: cwd});
                [child.stdout, child.stderr].forEach((stream) => {
                    if (stream !== null) {
                        stream.setEncoding('utf8');
                        stream.on('data', (data: string) => {
                            out.append(data);
                        });
                    }
                });

                child.on('close', function(code) {
                    resolve(code);
                });
            }));
}

// let terminal?: Terminal = null

// function getTerminal() {
//     if (terminal === null || terminal.exitStatus !== undefined) {
//         terminal = vscode.window.createTerminal('ThreatConnect');
//     }
//     return terminal;
// }
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// let out = vscode.window.createOutputChannel('ThreatConnect', 'plaintext');

	// context.subscriptions.push(vscode.commands.registerCommand('tcex-vscode.initalize', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user

	// 	runCommand('pip install "tcex[dev]"', 'Installing TcEx with pip', out).then((error: any) => {
	// 		if (error) {
	// 			vscode.window.showErrorMessage(`Error installing TcEx: ${error.name}: ${error.message}`);
	// 		}
	// 	});

	// 	vscode.window.showInputBox({
	// 		ignoreFocusOut: true,
	// 		title: 'Enter ThreatConnect API path',
	// 	}).then((apiPath?: string) => {
	// 		if (!apiPath) {
	// 			vscode.window.showErrorMessage('You must enter the ThreatConnect API path.');
	// 			return;
	// 		}
	// 		context.secrets.store('tcApiPath', apiPath);

	// 		vscode.window.showInputBox({
	// 			ignoreFocusOut: true,
	// 			title: 'Enter ThreatConnect API Access ID',
	// 		}).then((accessId?: string) => {
	// 			if (!accessId) {
	// 				vscode.window.showErrorMessage('You must enter the ThreatConnect API access ID.');
	// 				return;
	// 			}
	// 			context.secrets.store('tcApiAccessId', accessId);

	// 			vscode.window.showInputBox({
	// 				ignoreFocusOut: true,
	// 				password: true,
	// 				title: 'Enter ThreatConnect API Secret Key',
	// 			}).then((secretKey?: string) => {
	// 				if (!secretKey) {
	// 					vscode.window.showErrorMessage('You must enter the ThreatConnect API secret key.');
	// 					return;
	// 				}
	// 				context.secrets.store('tcApiSecretKey', secretKey);
	// 			});
	// 		});
	// 	});
	// }));

	// context.subscriptions.push(vscode.commands.registerCommand('tcex-vscode.deps', () => {
	// 	runCommand('tcex deps', 'Installing app dependencies', out).then((error: any) => {
	// 		if (error) {
	// 			vscode.window.showErrorMessage(`Error installing dependencies: ${error.name}: ${error.message}`);
	// 		}
	// 	});
	// }));

	// // context.subscriptions.push(vscode.commands.registerCommand('tcex-vscode.run', () => {
	// // 	runCommand('python run.py', 'Running app', out).then((error: any) => {
	// // 		if (error) {
	// // 			vscode.window.showErrorMessage(`Error running app: ${error.name}: ${error.message}`);
	// // 		}
	// // 	});
	// // }));

	// context.subscriptions.push(vscode.commands.registerCommand('tcex-vscode.deploy', () => {
	// 	context.secrets.get('tcApiPath').then((tcApiPath) => {
	// 			vscode.window.showInputBox({
	// 				title: 'ThreatConnect instance',
	// 				value: tcApiPath,
	// 				ignoreFocusOut: true,
	// 			}).then((val) => {
	// 				runCommand(`tcex deploy ${val}`, 'Deploying app', out).then((error: any) => {
	// 					if (error) {
	// 						vscode.window.showErrorMessage(`Error deploying app: ${error.name}: ${error.message}`);
	// 					} else {
	// 						vscode.window.showInformationMessage(`Deployed to ${tcApiPath}`);
	// 					}
	// 				});
	// 			});
	// 	});
	// }));

	// context.subscriptions.push(vscode.commands.registerCommand('tcex-vscode.package', () => {
	// 	// runCommand('tcex package', 'Packaging app', out).then((error: any) => {
	// 	// 	if (error) {
	// 	// 		vscode.window.showErrorMessage(`Error packaging app.`);
    //     //         out.show();
	// 	// 	}
	// 	// });
    //     // getTerminal().sendText('tcex package');
    //     // getTerminal().show();
	// }));

	// context.subscriptions.push(vscode.commands.registerCommand('tcex-vscode.create', () => {
	// 	vscode.window.showOpenDialog({
	// 		canSelectFiles: false,
	// 		canSelectFolders: true,
	// 		canSelectMany: false,
	// 		title: "Select directory to create app in"
	// 	}).then((value?: vscode.Uri[]) => {
	// 		if (!value) {
	// 			vscode.window.showErrorMessage('You must select a directory to create app in.');
	// 			return;
	// 		}
	// 		const appPath = value[0].path;

	// 		vscode.window.showQuickPick([
	// 			'api_service',
	// 			'external',
	// 			'organization',
	// 			'playbook',
	// 			'trigger_service',
	// 			'webhook_trigger_service',
	// 		], {
	// 			title: 'Choose App Type',
	// 			canPickMany: false,
	// 		}).then((type: string | undefined) => {
	// 			if (!type) {
	// 				vscode.window.showErrorMessage('You must select an app type.');
	// 				return;
	// 			}
	// 			getTemplates(type).then((templates: string[]) => {
	// 				if (!templates) {
	// 					vscode.window.showErrorMessage('Could not download app templates.');
	// 					return;
	// 				}
	// 				vscode.window.showQuickPick(templates, {canPickMany: false, title: 'Choose App Template'}).then((template?: string) => {
	// 					if (!template) {
	// 						vscode.window.showErrorMessage('You must select an app template.');
	// 						return;
	// 					}
	// 					runCommand(`tcex init --type ${type} --template ${template}`, 'Generating app', out, appPath).then((error: any) => {
	// 						if (error) {
	// 							vscode.window.showErrorMessage(`Error creating app: ${error.name}: ${error.message}`);
	// 							return;
	// 						}

	// 						vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.parse(appPath));
	// 					});

	// 				});
	// 			});
	// 		});
	// 	});
	// }));
}

// this method is called when your extension is deactivated
export function deactivate() {}
