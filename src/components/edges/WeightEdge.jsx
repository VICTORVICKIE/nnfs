import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import { selectParameters, useNeuralNetworkStore } from '../../stores/neuralNetworkStore';

export default function WeightEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd }) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Parse edge ID to get weight coordinates
    // Format: edge-layerIdx-fromIdx-toIdx
    const parts = id.split('-');
    let weightLabel = null;

    if (parts.length >= 4 && parts[0] === 'edge') {
        // Use Zustand selector - only re-renders when parameters change
        const params = useNeuralNetworkStore(selectParameters);
        const layerIdx = parseInt(parts[1]);
        const fromIdx = parseInt(parts[2]);
        const toIdx = parseInt(parts[3]);


        if (weight !== undefined) {
            weightLabel = `w${layerIdx + 1}${toIdx + 1}${fromIdx + 1} = ${weight.toFixed(2)}`;
        }
    }

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            {weightLabel && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            fontSize: 10,
                            pointerEvents: 'all',
                            backgroundColor: 'rgba(42, 42, 42, 0.8)',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            color: '#fff',
                        }}
                        className="nodrag nopan"
                    >
                        {weightLabel}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
