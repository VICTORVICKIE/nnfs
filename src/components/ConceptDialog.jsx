import { useEffect } from 'react';
import { conceptExplanations } from '../utils/conceptExplanations';
import './ConceptDialog.css';

export default function ConceptDialog({ conceptKey, onClose }) {
    const concept = conceptExplanations[conceptKey];

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!concept) {
        return null;
    }

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="dialog-content concept-dialog" onClick={(e) => e.stopPropagation()}>
                <button className="dialog-close" onClick={onClose} aria-label="Close dialog">
                    ×
                </button>

                <div className="concept-dialog-body">
                    <h2 className="concept-title">{concept.title}</h2>

                    <div 
                        className="concept-explanation" 
                        dangerouslySetInnerHTML={{ __html: concept.explanation }}
                    />

                    {concept.codeSnippet && (
                        <div className="concept-code-section">
                            <h3>Snippet</h3>
                            <pre className="concept-code">
                                <code>{concept.codeSnippet}</code>
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
