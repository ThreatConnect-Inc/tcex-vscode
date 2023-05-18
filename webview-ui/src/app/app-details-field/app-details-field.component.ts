import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-app-details-field',
    templateUrl: './app-details-field.component.html',
    styleUrls: ['./app-details-field.component.css']
})
export class AppDetailsFieldComponent {
    @Input()
    public label?: string;

    @Input()
    public value?: any;

    @Input()
    public type?: string;

    @Input()
    public options: any[] = [];

    constructor() { }

    ngOnInit(): void {
    }

    asArray(value: any): any[] {
        return value as any[];
    }
}
