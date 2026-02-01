import { Handle, NodeResizer, Position, useReactFlow } from '@xyflow/react';
import { useState } from 'react';
import { resolveCollisions } from '../../utils/collisionDetection';
import './NodeStyles.css';

export default function WeightNode({ data, selected }) {
  const {
    layerIndex = 0,
    weights = [],
    fromSize = 0,
    toSize = 0
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

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toFixed(3);
    }
    return '0.000';
  };

  const hasWeights = weights && weights.length > 0;

  return (
    <div className={`custom-node weight-node accordion-node ${isExpanded ? 'expanded' : ''}`}>
      <NodeResizer
        color="#f97316"
        isVisible={selected}
        minWidth={150}
        minHeight={isExpanded ? 200 : 50}
        onResizeEnd={handleResizeEnd}
      />
      <Handle type="target" position={Position.Left} id="input" />
      <div className="node-header accordion-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span>Weight {layerIndex + 1}</span>
        <span className="accordion-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="node-content">
          <div className="data-section">
            <div className="section-title">Shape: {toSize} × {fromSize}</div>
            {hasWeights ? (
              <div className="params-scroll">
                {weights.map((row, rowIdx) => (
                  <div key={rowIdx} className="param-row">
                    {row.map((val, colIdx) => (
                      <span key={colIdx} className="param-value">
                        {formatValue(val)}
                      </span>
                    ))}
                  </div>
                ))}
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
