// src/pages/dashboard/panels/CMSPanel.tsx
// Renders static HTML content from config
import React from 'react';

interface CMSPanelProps {
    config: {
        contentType?: 'html' | 'markdown';
        content?: string;
        contentUrl?: string;
    };
}

const CMSPanel: React.FC<CMSPanelProps> = ({ config }) => {
    const { content = '', contentType = 'html' } = config;

    if (!content) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>No content configured for this panel.</p>
            </div>
        );
    }

    if (contentType === 'html') {
        return (
            <div
                className="prose dark:prose-invert max-w-none p-4"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    // For markdown, just render as text for now
    // Could add markdown parser later
    return (
        <div className="p-4 whitespace-pre-wrap font-mono text-sm">
            {content}
        </div>
    );
};

export default CMSPanel;
