import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import * as vscode from 'vscode';
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as yaml from 'yaml';
import { AppSpecObserver } from "../appSpecWatcher";

const outputTypes = ["String", "StringArray", "KeyValue", "KeyValueArray", "TCEntity", "TCEntityArray"];


/**
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class AppBuilderPanel implements AppSpecObserver {
    public static currentPanel: AppBuilderPanel | undefined;
    private readonly _panel: WebviewPanel;
    private _disposables: Disposable[] = [];
    private _appYaml: any | undefined;

    /**
     * The HelloWorldPanel class private constructor (called only from the render method).
     *
     * @param panel A reference to the webview panel
     * @param extensionUri The URI of the directory containing the extension
     */
    private constructor(panel: WebviewPanel, extensionUri: Uri) {
        this._panel = panel;

        // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
        // the panel or when the panel is closed programmatically)
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.iconPath = Uri.joinPath(extensionUri, 'assets', 'icon.png');

        // Set the HTML content for the webview panel
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);


        // Set an event listener to listen for messages passed from the webview context
        this._setWebviewMessageListener(this._panel.webview);
    }
    onAppSpecChange(appSpec: any): void {
        this.appYaml = appSpec;
    }


    private get appYaml(): any {
        return this._appYaml;
    }

    private set appYaml(ij: any) {
        this._appYaml = ij;
        this._panel.webview.postMessage({ command: "appConfig", appSpec: this.appYaml });
    }

    get webview(): Webview {
        return this._panel.webview;
    }

    public static dispose() {
        AppBuilderPanel.currentPanel?.dispose();
        AppBuilderPanel.currentPanel = undefined;
    }

    /**
     * Renders the current webview panel if it exists otherwise a new webview panel
     * will be created and displayed.
     *
     * @param extensionUri The URI of the directory containing the extension.
     */
    public static render(extensionUri: Uri): AppBuilderPanel {
        if (AppBuilderPanel.currentPanel) {
            // If the webview panel already exists reveal it
            AppBuilderPanel.currentPanel._panel.reveal(ViewColumn.One);
        } else {
            // If a webview panel does not already exist create and show a new one
            const panel = window.createWebviewPanel(
                // Panel view type
                "showHelloWorld",
                // Panel title
                "TcEx App Builder",
                // The editor column the panel should be displayed in
                ViewColumn.One,
                // Extra panel configurations
                {
                    // Enable JavaScript in the webview
                    enableScripts: true,
                    // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
                    localResourceRoots: [
                        Uri.joinPath(extensionUri, "out"),
                        Uri.joinPath(extensionUri, "webview-ui/build"),
                        Uri.joinPath(extensionUri, "webview-ui/build/assets"),
                        Uri.joinPath(extensionUri, "assets")
                    ],
                }
            );

            AppBuilderPanel.currentPanel = new AppBuilderPanel(panel, extensionUri);
        }

        return AppBuilderPanel.currentPanel;
    }

    /**
     * Cleans up and disposes of webview resources when the webview panel is closed.
     */
    public dispose() {
        AppBuilderPanel.currentPanel = undefined;

        // Dispose of the current webview panel
        this._panel.dispose();

        // Dispose of all disposables (i.e. commands) for the current webview panel
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }


    /**
     * Defines and returns the HTML that should be rendered within the webview panel.
     *
     * @remarks This is also the place where references to the Angular webview build files
     * are created and inserted into the webview HTML.
     *
     * @param webview A reference to the extension webview
     * @param extensionUri The URI of the directory containing the extension
     * @returns A template string literal containing the HTML that should be
     * rendered within the webview panel
     */
    private _getWebviewContent(webview: Webview, extensionUri: Uri) {
        // The CSS file from the Angular build output
        const stylesUri = getUri(webview, extensionUri, ['webview-ui', 'build', 'styles.css']);
        // The JS files from the Angular build output
        const runtimeUri = getUri(webview, extensionUri, ['webview-ui', 'build', 'runtime.js']);
        const polyfillsUri = getUri(webview, extensionUri, ['webview-ui', 'build', 'polyfills.js']);
        const scriptUri = getUri(webview, extensionUri, ['webview-ui', 'build', 'main.js']);
        const baseUri = getUri(webview, extensionUri, ['webview-ui', 'build', 'assets']);
        const nonce = getNonce();

        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <!-- Since angular doesn't support nonce for loading css, etc, leave this out -->
              <!--meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';" -->

          <base href="${baseUri}">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>

          <app-root></app-root>
          <script type="module" nonce="${nonce}" src="${runtimeUri}"></script>
          <script type="module" nonce="${nonce}" src="${polyfillsUri}"></script>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
    }

    /**
     * Sets up an event listener to listen for messages passed from the webview context and
     * executes code based on the message that is recieved.
     *
     * @param webview A reference to the extension webview
     * @param context A reference to the extension context
     */
    private _setWebviewMessageListener(webview: Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;

                switch (command) {
                    case 'addOutput':
                        vscode.window.showInputBox({ prompt: "Output name" }).then((outputName) => {
                            vscode.window.showQuickPick(outputTypes).then((outputType) => {
                                if (outputName && outputType) {
                                    this.appYaml.playbook.outputVariables.push({
                                        name: outputName,
                                        type: outputType
                                    });
                                    vscode.workspace.fs.writeFile(this._appYaml, Buffer.from(JSON.stringify(this.appYaml, null, 4))).then(() => {
                                        this.webview.postMessage({ command: "appConfig", installJson: this.appYaml});
                                    });
                                }
                            });
                        });
                        break;
                    case 'hello':
                        this.webview.postMessage({ command: "appConfig", appSpec: this.appYaml });
                        break;
                    case 'sendToClipboard':
                        if (message.type === 'input') {
                            const name = message.value.name || message.value.label.toLowerCase().replace(/ /g, '_');
                            const accessor = message.value.encrypt ? '.value' : '';
                            const output = `self.in_.${name}${accessor}`;
                            vscode.env.clipboard.writeText(output).then(() => {
                                vscode.window.showInformationMessage(`Code copied to clipboard: ${output}`);
                            });
                        } else if (message.type === 'output') {
                            const name = message.value.name;
                            const output = `self.playbook.create.variable('${name}', ...)`;
                            vscode.env.clipboard.writeText(output).then(() => {
                                vscode.window.showInformationMessage(`Code copied to clipboard: ${output}`);
                            });
                        }

                }
            },
            undefined,
            this._disposables
        );
    }
}
