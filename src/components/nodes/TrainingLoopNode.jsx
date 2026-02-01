import { Handle, NodeResizer, Position, useReactFlow } from '@xyflow/react';
import { useState } from 'react';
import { resolveCollisions } from '../../utils/collisionDetection';
import './NodeStyles.css';

export default function TrainingLoopNode({ data, selected }) {
  const {
    trainingConfig = {},
    isTraining = false,
    currentStep = 0,
    currentLoss = null
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

  return (
    <div className={`custom-node training-loop-node accordion-node ${isExpanded ? 'expanded' : ''}`}>
      <NodeResizer
        color="#ec4899"
        isVisible={selected}
        minWidth={200}
        minHeight={isExpanded ? 150 : 50}
        onResizeEnd={handleResizeEnd}
      />
      <Handle type="target" position={Position.Left} id="training-data" />
      <Handle type="target" position={Position.Left} id="config" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Left} id="training-control" style={{ top: '70%' }} />
      <div className="node-header accordion-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span>Training Loop</span>
        <span className="accordion-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="node-content">
          <div className="data-section">
            <div className="section-title">Status</div>
            {isTraining ? (
              <div className="training-status">
                <div className="section-title">Running: Step {currentStep + 1} / {trainingConfig.steps}</div>
                {currentLoss !== null && (
                  <div className="section-title">Loss: {currentLoss.toFixed(6)}</div>
                )}
              </div>
            ) : (
              <div className="section-title">Ready to train</div>
            )}
          </div>
        </div>
      )}
      <Handle type="source" position={Position.Right} id="progress" style={{ top: '30%' }} />
      <Handle type="source" position={Position.Right} id="parameters" style={{ top: '70%' }} />
    </div>
  );
}
