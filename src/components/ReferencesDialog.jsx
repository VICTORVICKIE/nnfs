import { useEffect } from 'react';
import './ConceptDialog.css';

export default function ReferencesDialog({ onClose }) {
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

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="dialog-content concept-dialog" onClick={(e) => e.stopPropagation()}>
                <button className="dialog-close" onClick={onClose} aria-label="Close dialog">
                    ×
                </button>

                <div className="concept-dialog-body">
                    <h2 className="concept-title">References</h2>

                    <div className="concept-explanation">
                        <ul style={{ lineHeight: '2' }}>
                            <li>
                                <a 
                                    href="https://www.youtube.com/playlist?list=PLpM-Dvs8t0VZPZKggcql-MmjaBdZKeDMw" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    Neural Networks from Scratch - Tsoding Daily
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="https://xkcd.com/1838/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    xkcd: Machine Learning
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="https://www.jeremyjordan.me/content/images/2018/02/Screen-Shot-2018-02-24-at-11.47.09-AM.png" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    Learning Rate Explanation
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
