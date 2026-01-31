import { Handle, Position, NodeResizer } from '@xyflow/react';
import { useState } from 'react';
import './NodeStyles.css';

export default function BiasNode({ data, selected }) {
  const { 
    layerIndex = 0, 
    biases = [], 
    size = 0 
  } = data;
  
  const [isExpanded, setIsExpanded] = useState(false);

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toFixed(3);
    }
    return '0.000';
  };

  const hasBiases = biases && biases.length > 0;

  return (
    <div className={`custom-node bias-node accordion-node ${isExpanded ? 'expanded' : ''}`}>
      <NodeResizer 
        color="#8b5cf6" 
        isVisible={selected}
        minWidth={150}
        minHeight={isExpanded ? 150 : 50}
      />
      <Handle type="target" position={Position.Left} id="input" />
      <div className="node-header accordion-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span>Bias {layerIndex + 1}</span>
        <span className="accordion-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="node-content">
          <div className="data-section">
            <div className="section-title">Size: {size}</div>
            {hasBiases ? (
              <div className="params-scroll">
                <div className="param-column">
                  {biases.map((val, idx) => (
                    <span key={idx} className="param-value">
                      {formatValue(val)}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-data">Not initialized</div>
            )}
          </div>
        </div>
      )}
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}
