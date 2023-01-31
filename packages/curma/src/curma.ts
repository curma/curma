export type curmaConfig = {
    cdnDependencies?: {
        dev?: boolean;
        prod?: boolean;
        custom?: {
            [key: string]: string;
        }
    };
    error?: {
        cdnDependenciesNoVersion?: boolean;
    },
    root?: string;
}

export const defineConfig = (config: curmaConfig) => {
    return config
}