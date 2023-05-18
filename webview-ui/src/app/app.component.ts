import { Component, HostListener, OnInit } from "@angular/core";
import { provideVSCodeDesignSystem, allComponents } from "@vscode/webview-ui-toolkit";
import { vscode } from "./utilities/vscode";

import { AppSpec } from "./models/appSpec";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(allComponents);

// To register more toolkit components, simply import the component
// registration function and call it from within the register
// function, like so:
//
// provideVSCodeDesignSystem().register(
//   vsCodeButton(),
//   vsCodeCheckbox()
// );
//
// Finally, if you would like to register all of the toolkit
// components at once, there's a handy convenience function:
//
// provideVSCodeDesignSystem().register(allComponents);




@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {


    title = "hello-world";
    messageCount = 0;
    appSpec?: AppSpec;

    ngOnInit(): void {
        vscode.postMessage({
            command: "hello",
        });
    }

    @HostListener('window:message', ['$event'])
    handleKeyDown(event: Event) {
        const message = (event as MessageEvent).data;
        if (message.command === 'appConfig') {
            this.appSpec = message.appSpec;
            this.messageCount++;
        }
    }

    addOutput() {
        vscode.postMessage({
            command: "addOutput"
        });
    }

    sendToClipboard(type: string, value: any) {
        vscode.postMessage({
            command: "sendToClipboard",
            type: type,
            value: value,
        });
    }
}
