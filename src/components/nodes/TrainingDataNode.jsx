import { Handle, NodeResizer, Position, useReactFlow } from '@xyflow/react';
import { useState } from 'react';
import { useNeuralNetworkStore } from '../../stores/neuralNetworkStore';
import { resolveCollisions } from '../../utils/collisionDetection';
import './NodeStyles.css';

// Preset datasets with recommended hidden layer configurations
const PRESET_DATASETS = {
  custom: {
    name: 'Custom',
    x: [[1], [2], [3], [4], [5]],
    y: [[2], [4], [6], [8], [10]],
    hiddenLayers: [1],
    description: 'Custom dataset'
  },
  twice: {
    name: 'Twice (f(x) = 2x)',
    x: [[1], [2], [3], [4], [5], [6], [7], [8]],
    y: [[2], [4], [6], [8], [10], [12], [14], [16]],
    hiddenLayers: [1],
    description: 'Linear function - multiply by 2'
  },
  xor: {
    name: 'XOR Gate',
    x: [[0, 0], [0, 1], [1, 0], [1, 1]],
    y: [[0], [1], [1], [0]],
    hiddenLayers: [2],
    description: 'Non-linear XOR logic gate'
  },
  and: {
    name: 'AND Gate',
    x: [[0, 0], [0, 1], [1, 0], [1, 1]],
    y: [[0], [0], [0], [1]],
    hiddenLayers: [1],
    description: 'AND logic gate'
  },
  or: {
    name: 'OR Gate',
    x: [[0, 0], [0, 1], [1, 0], [1, 1]],
    y: [[0], [1], [1], [1]],
    hiddenLayers: [1],
    description: 'OR logic gate'
  },
  quadratic: {
    name: 'Quadratic (f(x) = x²)',
    x: [[0], [1], [2], [3], [4], [5]],
    y: [[0], [1], [4], [9], [16], [25]],
    hiddenLayers: [4],
    description: 'Quadratic function'
  },
  sine: {
    name: 'Sine Wave',
    x: [[0], [0.5], [1], [1.5], [2], [2.5], [3]],
    y: [[0], [0.479], [0.841], [0.997], [0.909], [0.599], [0.141]],
    hiddenLayers: [6],
    description: 'Sine wave approximation'
  },
  circle: {
    name: 'Circle Classification',
    x: [
      [0, 0], [0, 1], [1, 0], [1, 1],
      [0.5, 0.5], [0.8, 0.8], [0.2, 0.2],
      [0.9, 0.1], [0.1, 0.9]
    ],
    y: [[0], [0], [0], [0], [1], [0], [1], [0], [0]],
    hiddenLayers: [4],
    description: 'Classify points inside/outside circle'
  }
};

export default function TrainingDataNode({ data, selected }) {
  const { x: initialX = [], y: initialY = [] } = data;
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [hasError, setHasError] = useState(false);
  const updateTrainingData = useNeuralNetworkStore(state => state.updateTrainingData);
  const updateConfig = useNeuralNetworkStore(state => state.updateConfig);
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

  const parseValue = (value) => {
    if (typeof value === 'string') {
      const parsed = value.split(',').map(v => {
        const num = parseFloat(v.trim());
        return isNaN(num) ? 0 : num;
      }).filter(n => !isNaN(n));
      return parsed.length > 0 ? parsed : [0];
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  };

  const handleSave = (e) => {
    e.stopPropagation();

    // Parse and validate data
    const parsedX = x.map(parseValue).filter(arr => arr.length > 0);
    const parsedY = y.map(parseValue).filter(arr => arr.length > 0);

    if (parsedX.length === 0 || parsedY.length === 0) {
      setHasError(true);
      return;
    }

    if (parsedX.length !== parsedY.length) {
      setHasError(true);
      return;
    }

    // Clear any previous errors
    setHasError(false);

    // Save to Zustand store
    updateTrainingData({ x: parsedX, y: parsedY });

    // Update hidden layers if using a preset
    if (selectedPreset !== 'custom' && PRESET_DATASETS[selectedPreset]) {
      updateConfig({ hiddenLayers: PRESET_DATASETS[selectedPreset].hiddenLayers });
    }
  };

  const handlePresetChange = (e) => {
    const preset = e.target.value;
    setSelectedPreset(preset);
    setHasError(false);

    if (preset !== 'custom' && PRESET_DATASETS[preset]) {
      const dataset = PRESET_DATASETS[preset];
      setX(dataset.x);
      setY(dataset.y);
    }
  };

  const addSample = () => {
    setX([...x, [0]]);
    setY([...y, [0]]);
  };

  const removeSample = (index) => {
    setX(x.filter((_, i) => i !== index));
    setY(y.filter((_, i) => i !== index));
  };

  return (
    <div className="custom-node training-data-node">
      <NodeResizer
        color="#4ade80"
        isVisible={selected}
        minWidth={200}
        minHeight={150}
        onResizeEnd={handleResizeEnd}
      />
      <Handle type="target" position={Position.Left} />
      <div className="node-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Training Data</span>
        <button
          onClick={handleSave}
          onMouseDown={(e) => e.stopPropagation()}
          className="save-btn nodrag"
          style={{ padding: '4px 12px', fontSize: '12px' }}
        >
          Save
        </button>
      </div>
      <div className="node-content">
        <div className="data-section" style={{ marginBottom: '10px' }}>
          <div className="section-title">Dataset Preset</div>
          <select
            value={selectedPreset}
            onChange={handlePresetChange}
            onMouseDown={(e) => e.stopPropagation()}
            className="nodrag"
            style={{
              width: '100%',
              padding: '6px',
              fontSize: '12px',
              borderRadius: '4px',
              border: '1px solid #444',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {Object.entries(PRESET_DATASETS).map(([key, dataset]) => (
              <option key={key} value={key}>
                {dataset.name}
              </option>
            ))}
          </select>
          {selectedPreset !== 'custom' && PRESET_DATASETS[selectedPreset] && (
            <div style={{
              fontSize: '11px',
              color: '#888',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              {PRESET_DATASETS[selectedPreset].description}
              {' '} (Hidden: [{PRESET_DATASETS[selectedPreset].hiddenLayers.join(', ')}])
            </div>
          )}
        </div>
        <div className="data-section">
          <div className="section-title">Input x[]</div>
          {x.map((sample, idx) => (
            <div key={idx} className="sample-row">
              <input
                type="text"
                value={Array.isArray(sample) ? sample.join(', ') : sample}
                onChange={(e) => {
                  const newX = [...x];
                  newX[idx] = e.target.value;
                  setX(newX);
                  setHasError(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="data-input nodrag"
                placeholder="1"
                style={hasError ? { border: '2px solid #ef4444' } : {}}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSample(idx);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="remove-btn nodrag"
              >×</button>
            </div>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              addSample();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="add-btn nodrag"
          >+ Add Sample</button>
        </div>
        <div className="data-section">
          <div className="section-title">Expected Output y[]</div>
          {y.map((sample, idx) => (
            <div key={idx} className="sample-row">
              <input
                type="text"
                value={Array.isArray(sample) ? sample.join(', ') : sample}
                onChange={(e) => {
                  const newY = [...y];
                  newY[idx] = e.target.value;
                  setY(newY);
                  setHasError(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="data-input nodrag"
                placeholder="0"
                style={hasError ? { border: '2px solid #ef4444' } : {}}
              />
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}
