import { Handle, NodeResizer, Position } from '@xyflow/react';
import './NodeStyles.css';

export default function PredictionNode({ data, selected }) {
  const { input = [], output = null, onUpdateInput } = data;

  const handleInputChange = (e) => {
    onUpdateInput?.(e.target.value);
  };

  const { isTrained = false } = data;

  return (
    <div className={`custom-node prediction-node ${!isTrained ? 'not-trained' : ''}`}>
      <NodeResizer
        color="#f59e0b"
        isVisible={selected}
        minWidth={200}
        minHeight={150}
      />
      <Handle type="target" position={Position.Left} id="input" />
      <div className="node-header">Prediction</div>
      <div className="node-content">
        {!isTrained && (
          <div className="warning-message">
            ⚠️ Model must be trained before prediction
          </div>
        )}
        <div className="data-section">
          <div className="section-title">Input x[]</div>
          <input
            type="text"
            value={Array.isArray(input) ? input.join(', ') : input}
            onChange={handleInputChange}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="data-input nodrag"
            placeholder="3"
            disabled={!isTrained}
          />
        </div>
        <div className="data-section">
          <div className="section-title">Predicted ŷ[]</div>
          <div className="output-display">
            {output ? (
              Array.isArray(output) ? output.map((val, idx) => (
                <span key={idx} className="output-value">{val.toFixed(4)}</span>
              )) : (
                <span className="output-value">{output.toFixed(4)}</span>
              )
            ) : (
              <span className="output-placeholder">
                {isTrained ? 'No prediction yet' : 'Train model first'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
