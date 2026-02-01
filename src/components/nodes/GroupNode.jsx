import { Handle, NodeResizer, Position } from '@xyflow/react';
import { useEffect, useState } from 'react';
import './NodeStyles.css';

// Custom group node component for neural network group
export default function GroupNode({ data, selected }) {
  const {
    onToggle,
    label = 'Neural Network',
    trainingData = { x: [], y: [] },
    trainingConfig = {},
    config = {},
    onTrain,
    onNetworkConfigChange,
    onTrainingConfigChange,
    isTraining = false,
    currentStep = 0,
    trainingHistory = [],
    isTrained = false
  } = data;

  const [isRunning, setIsRunning] = useState(false);
  const [localStep, setLocalStep] = useState(0);
  const [localLoss, setLocalLoss] = useState(null);

  // Extract config values with defaults
  const hiddenLayers = config.hiddenLayers || [4];
  const activation = config.activation || 'relu';
  const costFunction = config.costFunction || 'mse';
  const steps = trainingConfig.steps || 100;
  const learningRate = trainingConfig.learningRate || 0.01;
  const method = trainingConfig.method || 'backpropagation';

  // Local state for pending configuration changes
  const [pendingHiddenLayers, setPendingHiddenLayers] = useState(hiddenLayers.join(', '));
  const [pendingActivation, setPendingActivation] = useState(activation);
  const [pendingCostFunction, setPendingCostFunction] = useState(costFunction);
  const [pendingSteps, setPendingSteps] = useState(steps);
  const [pendingLearningRate, setPendingLearningRate] = useState(learningRate);
  const [pendingMethod, setPendingMethod] = useState(method);

  // Sync pending hidden layers when config changes
  useEffect(() => {
    setPendingHiddenLayers(hiddenLayers.join(', '));
  }, [hiddenLayers.join(', ')]);

  // Configuration change handlers (now just update local state)
  const handleSaveConfig = (e) => {
    e.stopPropagation();

    const newHiddenLayers = pendingHiddenLayers.split(',').map(v => parseInt(v.trim()) || 1).filter(v => v > 0);
    onNetworkConfigChange?.({ hiddenLayers: newHiddenLayers, activation: pendingActivation, costFunction: pendingCostFunction });
    onTrainingConfigChange?.({ steps: pendingSteps, learningRate: pendingLearningRate, method: pendingMethod });
  };

  const handleTrain = async (e) => {
    e.stopPropagation();

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

  const displayStep = isRunning ? localStep : currentStep;
  const displayLoss = isRunning
    ? localLoss
    : (trainingHistory.length > 0 ? trainingHistory[trainingHistory.length - 1]?.loss : null);

  return (
    <>
      <NodeResizer
        color="#646cff"
        isVisible={selected}
        minWidth={750}
        minHeight={220}
      />
      <Handle type="target" position={Position.Left} id="input" />
      <Handle type="source" position={Position.Right} id="output" />
      <Handle type="source" position={Position.Bottom} id="bottom-left" style={{ left: '33%' }} />
      <Handle type="source" position={Position.Bottom} id="bottom-right" style={{ left: '66%' }} />
      <div className="neural-network-group-header">
        <div className="group-title">{label}</div>
        {isTrained && (
          <div className="config-warning">⚠️ Changes will invalidate training</div>
        )}
        <div className="config-panel">
          <div className="config-row">
            <label className="config-label">
              <span className="label-text">Hidden Layers:</span>
              <input
                type="text"
                value={pendingHiddenLayers}
                onChange={(e) => setPendingHiddenLayers(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="config-input nodrag"
                placeholder="4, 4"
                title="Input/output sizes auto-detected from training data"
              />
            </label>
            <label className="config-label">
              <span className="label-text">Activation:</span>
              <select
                value={pendingActivation}
                onChange={(e) => setPendingActivation(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="config-select nodrag"
              >
                <option value="relu">ReLU</option>
                <option value="sigmoid">Sigmoid</option>
                <option value="tanh">Tanh</option>
              </select>
            </label>
            <label className="config-label">
              <span className="label-text">Cost:</span>
              <select
                value={pendingCostFunction}
                onChange={(e) => setPendingCostFunction(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="config-select nodrag"
              >
                <option value="mse">MSE</option>
                <option value="crossentropy">Cross-Entropy</option>
              </select>
            </label>
            <label className="config-label">
              <span className="label-text">Steps:</span>
              <input
                type="number"
                value={pendingSteps}
                onChange={(e) => setPendingSteps(parseInt(e.target.value) || 0)}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="config-input nodrag"
                placeholder="100"
                min="1"
              />
            </label>
            <label className="config-label">
              <span className="label-text">LR:</span>
              <input
                type="number"
                value={pendingLearningRate}
                onChange={(e) => setPendingLearningRate(parseFloat(e.target.value) || 0)}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="config-input nodrag"
                placeholder="0.01"
                min="0.0001"
                step="0.001"
              />
            </label>
            <label className="config-label">
              <span className="label-text">Method:</span>
              <select
                value={pendingMethod}
                onChange={(e) => setPendingMethod(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="config-select nodrag"
              >
                <option value="backpropagation">BP</option>
                <option value="sgd">SGD</option>
                <option value="adam">Adam</option>
              </select>
            </label>
            <button
              onClick={handleSaveConfig}
              className="save-config-btn"
              style={{ marginLeft: '8px' }}
            >
              Save
            </button>
          </div>
        </div>
        <div className="group-header-controls">
          <button
            onClick={handleTrain}
            disabled={isRunning || isTraining}
            className={`train-btn ${isRunning || isTraining ? 'running' : ''}`}
            style={{ marginRight: '8px' }}
          >
            {isRunning || isTraining ? 'Training...' : 'Start Training'}
          </button>
          <button onClick={onToggle} className="collapse-btn">Collapse</button>
        </div>
      </div>
    </>
  );
}
