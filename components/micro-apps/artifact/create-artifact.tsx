/* eslint-disable @typescript-eslint/no-explicit-any */

import { Suggestion } from '@/lib/types';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from 'react';

export type ArtifactActionContext<M = any> = {
    content: string;
    handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
    currentVersionIndex: number;
    isCurrentVersion: boolean;
    mode: 'edit' | 'diff';
    metadata: M;
    setMetadata: Dispatch<SetStateAction<M>>;
};

type ArtifactAction<M = any> = {
    icon: ReactNode;
    label?: string;
    description: string;
    onClick: (context: ArtifactActionContext<M>) => Promise<void> | void;
    isDisabled?: (context: ArtifactActionContext<M>) => boolean;
};

export type ArtifactToolbarContext = {
    appendMessage: UseChatHelpers['append'];
};

export type ArtifactToolbarItem = {
    description: string;
    icon: ReactNode;
    onClick: (context: ArtifactToolbarContext) => void;
};

interface ArtifactContent<M = any> {
    title: string;
    content: string;
    mode: 'edit' | 'diff';
    isCurrentVersion: boolean;
    currentVersionIndex: number;
    status: 'streaming' | 'idle';
    suggestions: Array<Suggestion>;
    onSaveContent: (updatedContent: string, debounce: boolean) => void;
    isInline: boolean;
    getDocumentContentById: (index: number) => string;
    isLoading: boolean;
    metadata: M;
    setMetadata: Dispatch<SetStateAction<M>>;
}

interface InitializeParameters<M = any> {
    artifactId: string;
    setMetadata: Dispatch<SetStateAction<M>>;
}

type ArtifactConfig<T extends string, M = any> = {
    kind: T;
    description: string;
    content: ComponentType<ArtifactContent<M>>;
    actions: Array<ArtifactAction<M>>;
    toolbar: ArtifactToolbarItem[];
    initialize?: (parameters: InitializeParameters<M>) => void;
};

export class Artifact<T extends string, M = any> {
    readonly kind: T;
    readonly description: string;
    readonly content: ComponentType<ArtifactContent<M>>;
    readonly actions: Array<ArtifactAction<M>>;
    readonly toolbar: ArtifactToolbarItem[];
    readonly initialize?: (parameters: InitializeParameters) => void;

    constructor(config: ArtifactConfig<T, M>) {
        this.kind = config.kind;
        this.description = config.description;
        this.content = config.content;
        this.actions = config.actions || [];
        this.toolbar = config.toolbar || [];
        this.initialize = config.initialize || (async () => ({}));
    }
}
