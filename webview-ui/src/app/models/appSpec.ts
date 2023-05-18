interface Section {
    params: any[],
    sectionName: string,
}

interface OutputSection {
    display: string,
    outputVariables: {
        name: string,
        type?: string,
    }[],
}

interface ReleaseNote {
    notes: string[],
    version: string,
}

export interface AppSpec {
    displayName: string,
    packageName: string,
    category: string,
    programVersion: string,
    releaseNotes?: ReleaseNote[],
    deprecateApps?: string[],
    features?: string[],
    lables?: string[],
    minServerVersion?: string,
    note?: string,
    runtimeLevel: string,
    sections: Section[],
    outputData: OutputSection[],
    outputPrefix?: string,
    allowOndemand?: boolean,
    programLanguage?: string,
    languageVersion: string,
    programMain: string,
    listDelimiter?: string,
    schemaVersion?: string,
}
