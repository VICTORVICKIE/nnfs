import { Handle, NodeResizer, Position } from '@xyflow/react';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { selectCurrentStep, selectTrainingHistory, useNeuralNetworkStore } from '../../stores/neuralNetworkStore';
import './NodeStyles.css';

export default function TrainingProgressNode({ data, selected }) {
  // Use Zustand selector - only re-renders when training history changes
  const history = useNeuralNetworkStore(selectTrainingHistory);
  const currentStep = useNeuralNetworkStore(selectCurrentStep); // Subscribe for real-time updates

  const chartData = history.map(({ step, loss }) => ({
    step,
    loss: loss || 0
  }));

  return (
    <div className="custom-node training-progress-node">
      <NodeResizer
        color="#10b981"
        isVisible={selected}
        minWidth={350}
        minHeight={350}
      />
      <Handle type="target" position={Position.Top} id="input" />
      <div className="node-header">
        <span>Training Progress</span>
      </div>
      {(
        <div className="node-content">
          <div className="chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis
                    dataKey="step"
                    stroke="#888"
                    style={{ fontSize: '10px' }}
                  />
                  <YAxis
                    stroke="#888"
                    style={{ fontSize: '10px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#2a2a2a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke="#4ade80"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No training data yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
