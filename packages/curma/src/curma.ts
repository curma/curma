type curmaConfig = {
    cdnDependencies?: {
        dev?: boolean;
        prod?: boolean;
    };
    error: {
        cdnDependenciesNoVersion?: boolean;
    },
    root?: string;
}

export const defineConfig = (config: curmaConfig) => {
    return config
}