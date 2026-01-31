import { Handle, Position } from '@xyflow/react';
import './NodeStyles.css';

export default function NeuronNode({ data, selected }) {
    const {
        layerIndex = 0,
        neuronIndex = 0,
        activation = 0,
        bias = 0,
        isInput = false,
        isOutput = false
    } = data;

    return (
        <div className={`neuron-node ${isInput ? 'input-neuron' : ''} ${isOutput ? 'output-neuron' : ''}`}>
            {!isInput && <Handle type="target" position={Position.Left} />}
            <div className="neuron-circle">
                <div className="neuron-label">
                    {isInput ? `x${neuronIndex + 1}` : isOutput ? `ŷ${neuronIndex + 1}` : `a${layerIndex}${neuronIndex + 1}`}
                </div>
                {!isInput && (
                    <div className="neuron-bias">b = {bias.toFixed(2)}</div>
                )}
            </div>
            {!isOutput && <Handle type="source" position={Position.Right} />}
        </div>
    );
}
