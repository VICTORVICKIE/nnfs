import { Handle, Position, NodeResizer } from '@xyflow/react';
import { useState } from 'react';
import Cube3D from '../Cube3D';
import './NodeStyles.css';

export default function NeuralNetworkNode({ data, selected }) {
  const { 
    isExpanded = false, 
    onToggle,
    trainingData = { x: [], y: [] },
    config = {},
    trainingConfig = {},
    onTrain,
    isTraining = false,
    currentStep: externalCurrentStep = 0,
    trainingHistory = [],
    isTrained = false
  } = data;

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentLoss, setCurrentLoss] = useState(null);

  // Use external state (from hook) if training is not running locally
  const displayStep = isRunning ? currentStep : externalCurrentStep;
  const displayLoss = isRunning 
    ? currentLoss 
    : (trainingHistory.length > 0 ? trainingHistory[trainingHistory.length - 1]?.loss : null);

  const handleTrain = async (e) => {
    e.stopPropagation(); // Prevent expand/collapse when clicking train
    
    if (!trainingConfig.steps || trainingConfig.steps < 1) {
      alert('Training steps must be provided and greater than 0');
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);
    setCurrentLoss(null);

    try {
      await onTrain?.(trainingData.x, trainingData.y, async (step, loss, parameters) => {
        setCurrentStep(step);
        setCurrentLoss(loss);
      });
    } catch (error) {
      console.error('Training error:', error);
      alert('Training failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  // Note: When expanded, this node becomes type 'group' and React Flow handles it differently
  // The group header is rendered by GroupNode component
  if (isExpanded) {
    return null; // Group nodes are handled by React Flow's built-in group rendering
  }

  // When collapsed, render normal node with cube and training button
  return (
    <div className={`custom-node neural-network-node`}>
      <NodeResizer 
        color="#646cff" 
        isVisible={selected}
        minWidth={250}
        minHeight={200}
      />
      <Handle type="target" position={Position.Left} />
      <div className="node-header">Neural Network</div>
      <div className="node-content">
        <div className="cube-container" onClick={onToggle}>
          <Cube3D onClick={onToggle} isExpanded={isExpanded} />
        </div>
        <div className="train-section-collapsed">
          <button 
            onClick={handleTrain} 
            disabled={isRunning || isTraining}
            className={`train-btn ${isRunning || isTraining ? 'running' : ''}`}
          >
            {isRunning || isTraining ? 'Training...' : 'Start Training'}
          </button>
          {(isRunning || isTraining || isTrained) && (
            <div className="training-status">
              {(displayStep > 0 || isTrained) && (
                <>
                  <div className="section-title">Step: {displayStep + 1} / {trainingConfig.steps}</div>
                  {displayLoss !== null && (
                    <div className="section-title">Loss: {displayLoss.toFixed(6)}</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}
