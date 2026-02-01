import { Handle, NodeResizer, Position, useReactFlow } from '@xyflow/react';
import { useEffect, useState } from 'react';
import { resolveCollisions } from '../../utils/collisionDetection';
import './NodeStyles.css';

export default function ForwardPassNode({ data, selected }) {
  const {
    parameters = null,
    input = [],
    network = null,
    onOutput
  } = data;

  const [isExpanded, setIsExpanded] = useState(false);
  const { setNodes } = useReactFlow();

  const handleResizeEnd = () => {
    setNodes((nds) =>
      resolveCollisions(nds, {
        maxIterations: 50,
        overlapThreshold: 0.5,
        margin: 15,
      })
    );
  };

  useEffect(() => {
    if (parameters && network && input && Array.isArray(input) && input.length > 0) {
      try {
        // Network already has the parameters from training, just predict
        const output = network.predict(input);
        if (output) {
          onOutput?.(output);
        }
      } catch (error) {
        console.error('Forward pass error:', error);
      }
    }
  }, [parameters, input, network, onOutput]);

  return (
    <div className={`custom-node forward-pass-node accordion-node ${isExpanded ? 'expanded' : ''}`}>
      <NodeResizer
        color="#06b6d4"
        isVisible={selected}
        minWidth={200}
        minHeight={isExpanded ? 150 : 50}
        onResizeEnd={handleResizeEnd}
      />
      <Handle type="target" position={Position.Left} id="parameters" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Left} id="input" style={{ top: '70%' }} />
      <div className="node-header accordion-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span>Forward Pass</span>
        <span className="accordion-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="node-content">
          <div className="data-section">
            <div className="section-title">Input</div>
            <div className="output-display">
              {Array.isArray(input) ? input.map((val, idx) => (
                <span key={idx} className="output-value">{val}</span>
              )) : (
                <span className="output-value">{input}</span>
              )}
            </div>
          </div>
          <div className="data-section">
            <div className="section-title">Status</div>
            <div className="status-indicator">
              {parameters ? (
                <span className="status-ready">Ready</span>
              ) : (
                <span className="status-waiting">Waiting for parameters</span>
              )}
            </div>
          </div>
        </div>
      )}
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}
