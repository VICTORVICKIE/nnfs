import { Handle, NodeResizer, Position } from '@xyflow/react';
import { useState } from 'react';
import {
  selectCurrentStep,
  selectIsTrained,
  selectIsTraining,
  selectTrainingData,
  selectTrainingHistory,
  useNeuralNetworkStore,
} from '../../stores/neuralNetworkStore';
import Cube3D from '../Cube3D';
import './NodeStyles.css';

export default function NeuralNetworkNode({ data, selected }) {
  // Use Zustand selectors - only re-renders when specific values change
  const trainingData = useNeuralNetworkStore(selectTrainingData);
  const isTraining = useNeuralNetworkStore(selectIsTraining);
  const currentStep = useNeuralNetworkStore(selectCurrentStep);
  const trainingHistory = useNeuralNetworkStore(selectTrainingHistory);
  const isTrained = useNeuralNetworkStore(selectIsTrained);

  const {
    isExpanded = false,
    onToggle,
    config = {},
    trainingConfig = {},
    onTrain,
  } = data;

  const [isRunning, setIsRunning] = useState(false);
  const [localStep, setLocalStep] = useState(0);
  const [localLoss, setLocalLoss] = useState(null);

  // Use context state (updates live during training)
  const displayStep = isRunning ? localStep : currentStep;
  const displayLoss = isRunning
    ? localLoss
    : (trainingHistory.length > 0 ? trainingHistory[trainingHistory.length - 1]?.loss : null);

  const handleTrain = async (e) => {
    e.stopPropagation(); // Prevent expand/collapse when clicking train

    if (!trainingConfig.steps || trainingConfig.steps < 1) {
      alert('Training steps must be provided and greater than 0');
      return;
    }

    setIsRunning(true);
    setLocalStep(0);
    setLocalLoss(null);

    try {
      await onTrain?.(async (step, loss, parameters) => {
        setLocalStep(step);
        setLocalLoss(loss);
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
      <Handle type="source" position={Position.Bottom} id="bottom-left" style={{ left: '33%' }} />
      <Handle type="source" position={Position.Bottom} id="bottom-right" style={{ left: '66%' }} />
    </div>
  );
}
