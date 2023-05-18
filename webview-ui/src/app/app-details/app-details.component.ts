import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { provideVSCodeDesignSystem, allComponents } from "@vscode/webview-ui-toolkit";

import { AppSpec } from '../models/appSpec';


provideVSCodeDesignSystem().register(allComponents);


interface Option {
    name: string;
    value: string;
}

class DetailField {
    public readonly label: string;

    constructor(
        public readonly key: keyof AppSpec,
        public readonly type: string,
        public readonly options: Option[] = [],
    ) {
        this.label = this.toTitleCase(key.replace(/(?<!^)(?=[A-Z])/g, ' '));
    }

    private toTitleCase(str: string): string {
        return str.replace(
          /\w\S*/g,
          function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          }
        );
      }
}

class Details {
    constructor(
        private readonly fields: DetailField[],
    ) {}

    get displayName(): DetailField | undefined {
        return this.fields.find(field => field.key === 'displayName') as DetailField;
    }

    get packageName(): DetailField | undefined {
        return this.fields.find(field => field.key === 'packageName') as DetailField;
    }

    get programVersion(): DetailField | undefined {
        return this.fields.find(field => field.key === 'programVersion') as DetailField;
    }

    get features(): DetailField | undefined {
        return this.fields.find(field => field.key === 'features') as DetailField;
    }

    get labels(): DetailField | undefined {
        return this.fields.find(field => field.key as string === 'labels') as DetailField;
    }

    get note(): DetailField | undefined {
        return this.fields.find(field => field.key === 'note') as DetailField;
    }

    get runtimeLevel(): DetailField | undefined {
        return this.fields.find(field => field.key === 'runtimeLevel') as DetailField;
    }

    get otherFields(): DetailField[] {
        return this.fields.filter(field => ![
            'displayName',
            'packageName',
            'programVersion',
            'features',
            'labels',
            'note',
            'runtimeLevel',
        ].includes(field.key));
    }

}

@Component({
    selector: 'app-app-details',
    templateUrl: './app-details.component.html',
    styleUrls: ['./app-details.component.css']
})
export class AppDetailsComponent implements OnChanges {

    @Input('app-spec')
    appSpec?: AppSpec;
    details?: Details;

    readonly runtimeLevels = [
        {
            'name': 'Playbook',
            'value': 'playbook',
        },
        {
            'name': 'Organization',
            'value': 'organization',
        }
    ]

    readonly excludedFields = [
        'internalNotes',
        'notePerAction',
        'outputData',
        'releaseNotes',
        'sections',
        'playbook',
    ];

    readonly optionFields = [
        'runtimeLevel',
    ];

    ngOnChanges(changes: SimpleChanges): void {
        this.generateFields();
    }

    private generateFields() {
        const fields: DetailField[] = [];

        if (!this.appSpec) {
            this.details = undefined;
            return;
        }

        for (const key of Object.keys(this.appSpec)) {
            if (!this.excludedFields.includes(key)) {
                let type = 'text';
                let options: Option[] = [];

                if (Array.isArray(this.appSpec[key as keyof AppSpec])) {
                    type = 'array';
                } else if (key === 'note') {
                    type = 'textarea';
                } else if (this.optionFields.includes(key)) {
                    type = 'option';
                    if (key === 'runtimeLevel') {
                        options = this.runtimeLevels;
                    } else {
                        const value = this.appSpec[key as keyof AppSpec] as string;
                        options = [{
                            name: value,
                            value: value,
                        }];
                    }
                }

                fields.push(new DetailField(key as keyof AppSpec, type, options));
            }
        }

        this.details = new Details(fields);
    }


}
