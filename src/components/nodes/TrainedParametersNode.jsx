import { Handle, NodeResizer, Position, useReactFlow } from '@xyflow/react';
import { useState } from 'react';
import { resolveCollisions } from '../../utils/collisionDetection';
import './NodeStyles.css';

export default function TrainedParametersNode({ data, selected }) {
  const { parameters = null } = data;

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
      return val.toFixed(4);
    }
    return String(val);
  };

  return (
    <div className={`custom-node trained-parameters-node accordion-node ${isExpanded ? 'expanded' : ''}`}>
      <NodeResizer
        color="#f97316"
        isVisible={selected}
        minWidth={250}
        minHeight={isExpanded ? 300 : 50}
        onResizeEnd={handleResizeEnd}
      />
      <Handle type="target" position={Position.Left} id="input" />
      <div className="node-header accordion-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span>Trained Parameters</span>
        <span className="accordion-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="node-content">
          {parameters ? (
            <div className="parameters-display">
              <div className="data-section">
                <div className="section-title">Weights</div>
                <div className="params-scroll">
                  {parameters.weights?.map((layer, layerIdx) => (
                    <div key={layerIdx} className="layer-params">
                      <div className="layer-label">Layer {layerIdx + 1}</div>
                      {layer.map((row, rowIdx) => (
                        <div key={rowIdx} className="param-row">
                          {row.map((val, colIdx) => (
                            <span key={colIdx} className="param-value">
                              {formatValue(val)}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="data-section">
                <div className="section-title">Biases</div>
                <div className="params-scroll">
                  {parameters.biases?.map((layer, layerIdx) => (
                    <div key={layerIdx} className="layer-params">
                      <div className="layer-label">Layer {layerIdx + 1}</div>
                      <div className="param-row">
                        {layer.map((val, idx) => (
                          <span key={idx} className="param-value">
                            {formatValue(val)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-data">No trained parameters yet</div>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}
