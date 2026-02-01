import { Handle, NodeResizer, Position } from '@xyflow/react';
import { useState } from 'react';
import { useNeuralNetworkStore } from '../../stores/neuralNetworkStore';
import './NodeStyles.css';

export default function TrainingDataNode({ data, selected }) {
  const { x: initialX = [], y: initialY = [] } = data;
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const updateTrainingData = useNeuralNetworkStore(state => state.updateTrainingData);

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
      alert('Training data is empty. Please add at least one sample.');
      return;
    }

    if (parsedX.length !== parsedY.length) {
      alert(`Data mismatch: ${parsedX.length} inputs but ${parsedY.length} outputs. They must match.`);
      return;
    }

    // Save to Zustand store
    updateTrainingData({ x: parsedX, y: parsedY });
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
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="data-input nodrag"
                placeholder="1"
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
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="data-input nodrag"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
}
