import { Handle, NodeResizer, Position } from '@xyflow/react';
import './NodeStyles.css';

export default function TrainingDataNode({ data, selected }) {
  const { x = [], y = [], onUpdate } = data;

  const handleXChange = (index, value) => {
    const newX = [...x];
    newX[index] = parseFloat(value) || 0;
    onUpdate?.({ x: newX, y });
  };

  const handleYChange = (index, value) => {
    const newY = [...y];
    newY[index] = parseFloat(value) || 0;
    onUpdate?.({ x, y: newY });
  };

  const addSample = () => {
    onUpdate?.({
      x: [...x, [0]],
      y: [...y, [0]]
    });
  };

  const removeSample = (index) => {
    onUpdate?.({
      x: x.filter((_, i) => i !== index),
      y: y.filter((_, i) => i !== index)
    });
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
      <div className="node-header">Training Data</div>
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
                  onUpdate?.({ x: newX, y });
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
                  onUpdate?.({ x, y: newY });
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
