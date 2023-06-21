import * as vscode from 'vscode';
import { AppBuilderPanel } from './panels/AppBuilderPanel';

import { findFilesInWorkspace } from './utilities/findFilesInWorkspace';
import { AppSpecWatcher } from './appSpecWatcher';
import { TcExStatusBarItem } from './statusBarItem';
import { TerminalManager } from './terminalManager';
import { deployCommand, terminalCommand } from './commands/command';

function registerCommands(context: vscode.ExtensionContext, appInfo: any, tcexTerminal: TerminalManager) {
  vscode.window.showInformationMessage(`TcEx version ${appInfo.tcexVersion} detected.`);

  // Register the commands
  context.subscriptions.push(
    vscode.commands.registerCommand('tcex-appbuilder.showAppInfo', () => {
      findFilesInWorkspace('app_spec.yml').then((files) => {
        AppSpecWatcher.register(AppBuilderPanel.render(context.extensionUri));
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('tcex-appbuilder.listCommands', () => {
      const commands = [
        'TcEx: Install App Dependencies',
        'TcEx: Package App',
        'TcEx: Generate All',
        'TcEx: Show App Info',
      ];

      const deployTarget = vscode.workspace.getConfiguration('tcex').get('deployTarget');

      if (deployTarget) {
        commands.push('TcEx: Deploy App');
      }

      vscode.window.showQuickPick(commands).then((selection) => {
        switch (selection) {
          case 'TcEx: Install App Dependencies':
            vscode.commands.executeCommand('tcex-appbuilder.deps');
            break;
          case 'TcEx: Package App':
            vscode.commands.executeCommand('tcex-appbuilder.package');
            break;
          case 'TcEx: Generate All':
            vscode.commands.executeCommand('tcex-appbuilder.app_spec.all');
            break;
          case 'TcEx: Show App Info':
            vscode.commands.executeCommand('tcex-appbuilder.showAppInfo');
            break;
          case 'TcEx: Deploy App':
            vscode.commands.executeCommand('tcex-appbuilder.deploy');
            break;
        }
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'tcex-appbuilder.app_spec.app_spec',
      terminalCommand(
        appInfo.tcexVersion === 4 ? 'tcex spec-tool --app-spec' : 'tcex spectool --app-spec',
        tcexTerminal
      )
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'tcex-appbuilder.app_spec.all',
      terminalCommand(
        appInfo.tcexVersion === 4
          ? 'tcex spec-tool --install-json --layout-json --readme-md --tcex-json'
          : 'tcex spectool --install-json --layout-json --readme-md --tcex-json',
        tcexTerminal
      )
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('tcex-appbuilder.deps', terminalCommand('tcex deps', tcexTerminal))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('tcex-appbuilder.package', terminalCommand('tcex package', tcexTerminal))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('tcex-appbuilder.run', terminalCommand('tcex run', tcexTerminal))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'tcex-appbuilder.deploy',
      deployCommand(tcexTerminal, vscode.workspace.getConfiguration('tcex').get('deployTarget'))
    )
  );
}

export function activate(context: vscode.ExtensionContext) {
  const tcexTerminal = new TerminalManager({
    cwd: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
    name: 'TcEx',
    iconPath: new vscode.ThemeIcon('threatconnect-icon'),
  });

  findFilesInWorkspace('requirements.txt').then((files) => {
    const appInfo = {
      tcexVersion: 4,
    };
    if (files.length === 1) {
      vscode.workspace.openTextDocument(files[0]).then((document) => {
        const regex = /^tcex.+(\d)\.\d+\.\d+.+/gm;
        const match = regex.exec(document.getText());
        if (match) {
          appInfo.tcexVersion = parseInt(match[1]);
          registerCommands(context, appInfo, tcexTerminal);
        }
      });
    } else {
      registerCommands(context, appInfo, tcexTerminal);
    }
  });

  // see if we have an app_spec and if we don't, prompt user to generate it.
  findFilesInWorkspace('app_spec.yml').then((files) => {
    if (files.length === 0) {
      const actions = [{ title: 'Yes', action: 'generate' }];

      vscode.window
        .showInformationMessage(
          'No app_spec.yml found. Would you like to generate one?',
          { modal: false } as vscode.MessageOptions,
          ...actions
        )
        .then((selection) => {
          if (selection === actions[0]) {
            vscode.commands.executeCommand('tcex-appbuilder.app_spec.app_spec');
          }
        });
    }
  });

  findFilesInWorkspace('app_inputs.json').then((files) => {
    vscode.commands.executeCommand('setContext', 'tcex.appInputsJsonExists', files.length !== 0);
  });

  const appInputJsonWatcher = vscode.workspace.createFileSystemWatcher('**/app_inputs.json');

  appInputJsonWatcher.onDidDelete(() => {
    vscode.commands.executeCommand('setContext', 'tcex.appInputsJsonExists', false);
  });

  appInputJsonWatcher.onDidCreate(() => {
    vscode.commands.executeCommand('setContext', 'tcex.appInputsJsonExists', true);
  });

  context.subscriptions.push(appInputJsonWatcher);

  context.subscriptions.push(AppSpecWatcher);
  context.subscriptions.push(AppBuilderPanel);
  context.subscriptions.push(TcExStatusBarItem);
  context.subscriptions.push(tcexTerminal);

  AppSpecWatcher.register(TcExStatusBarItem.create());
}
