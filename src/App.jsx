import { useCallback, useEffect, useMemo, useRef } from 'react';
import './App.css';
import FlowCanvas from './components/FlowCanvas';
import BiasNode from './components/nodes/BiasNode';
import ForwardPassNode from './components/nodes/ForwardPassNode';
import GroupNode from './components/nodes/GroupNode';
import NeuralNetworkNode from './components/nodes/NeuralNetworkNode';
import NeuronNode from './components/nodes/NeuronNode';
import PredictionNode from './components/nodes/PredictionNode';
import SimpleGroupNode from './components/nodes/SimpleGroupNode';
import TrainedParametersNode from './components/nodes/TrainedParametersNode';
import TrainingDataNode from './components/nodes/TrainingDataNode';
import TrainingLoopNode from './components/nodes/TrainingLoopNode';
import TrainingProgressNode from './components/nodes/TrainingProgressNode';
import WeightNode from './components/nodes/WeightNode';
import { useFlowState } from './hooks/useFlowState.jsx';
import { useNeuralNetwork } from './hooks/useNeuralNetwork';

const nodeTypes = {
  trainingData: TrainingDataNode,
  neuralNetwork: NeuralNetworkNode,
  prediction: PredictionNode,
  trainingLoop: TrainingLoopNode,
  trainingProgress: TrainingProgressNode,
  trainedParameters: TrainedParametersNode,
  forwardPass: ForwardPassNode,
  weight: WeightNode,
  bias: BiasNode,
  neuron: NeuronNode,
  group: GroupNode,
  simpleGroup: SimpleGroupNode,
};

function App() {
  const nnState = useNeuralNetwork();
  const flowState = useFlowState(nnState.config);

  // Handle configuration updates (invalidates training)
  const handleConfigUpdate = useCallback((newConfig) => {
    nnState.updateConfig(newConfig);
  }, [nnState.updateConfig]);

  // Handle training config updates (invalidates training)
  const handleTrainingConfigUpdate = useCallback((newTrainingConfig) => {
    nnState.updateTrainingConfig(newTrainingConfig);
  }, [nnState.updateTrainingConfig]);

  // Handle training step updates
  const handleTrainingStep = useCallback((step, loss, parameters) => {
    // Update training progress node data
    // This will be handled through node data updates
  }, []);

  // Handle training completion
  const handleTrain = useCallback(async (x, y, onStep) => {
    // Parse raw strings into arrays of numbers
    const parseInput = (val) => {
      if (typeof val === 'string') {
        return val.split(',').map(v => {
          const num = parseFloat(v.trim());
          return isNaN(num) ? 0 : num;
        });
      }
      return val;
    };

    const parsedX = x.map(parseInput);
    const parsedY = y.map(parseInput);

    // Validate training data structure
    if (!parsedX || !parsedY || !Array.isArray(parsedX) || !Array.isArray(parsedY)) {
      alert('Invalid training data: x and y must be arrays');
      return;
    }

    if (parsedX.length === 0 || parsedY.length === 0) {
      alert('Training data is empty. Please add training samples.');
      return;
    }

    if (parsedX.length !== parsedY.length) {
      alert(`Training data mismatch: ${parsedX.length} inputs but ${parsedY.length} outputs. They must match.`);
      return;
    }

    // Validate that all samples are arrays of numbers
    for (let i = 0; i < parsedX.length; i++) {
      if (!Array.isArray(parsedX[i]) || parsedX[i].some(v => typeof v !== 'number' || isNaN(v))) {
        alert(`Invalid input at sample ${i + 1}: must be comma-separated numbers`);
        return;
      }
      if (!Array.isArray(parsedY[i]) || parsedY[i].some(v => typeof v !== 'number' || isNaN(v))) {
        alert(`Invalid output at sample ${i + 1}: must be comma-separated numbers`);
        return;
      }
    }

    // Auto-detect input and output dimensions from data
    const actualInputSize = parsedX[0].length;
    const actualOutputSize = parsedY[0].length;
    const currentLayers = nnState.config.layers;

    // Auto-adjust network architecture if dimensions don't match
    if (currentLayers[0] !== actualInputSize || currentLayers[currentLayers.length - 1] !== actualOutputSize) {
      // Keep middle layers, just adjust input/output
      const newLayers = [actualInputSize, ...currentLayers.slice(1, -1), actualOutputSize];

      // If no middle layers, add a default hidden layer
      if (newLayers.length === 2) {
        const hiddenSize = Math.max(4, Math.ceil((actualInputSize + actualOutputSize) / 2));
        newLayers.splice(1, 0, hiddenSize);
      }

      console.log(`Auto-adjusting network: ${currentLayers.join('->')} → ${newLayers.join('->')}`);
      nnState.updateConfig({ layers: newLayers });

      // Need to wait a tick for the config to update
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    await nnState.train(parsedX, parsedY, onStep);
  }, [nnState]);

  // Update prediction when forward pass completes or input changes
  useEffect(() => {
    if (nnState.isTrained && flowState.predictionInput) {
      try {
        // Parse input if it's a string
        let input = flowState.predictionInput;
        if (typeof input === 'string') {
          input = input.split(',').map(v => {
            const num = parseFloat(v.trim());
            return isNaN(num) ? 0 : num;
          });
        }

        if (Array.isArray(input) && input.length > 0) {
          const output = nnState.predict(input);
          if (output) {
            flowState.updatePredictionOutput(output);
          }
        }
      } catch (error) {
        console.error('Prediction error:', error);
      }
    } else if (!nnState.isTrained) {
      flowState.updatePredictionOutput(null);
    }
  }, [nnState.isTrained, flowState.predictionInput, nnState.predict, flowState.updatePredictionOutput]);

  // Calculate group size based on child nodes
  const calculateGroupSize = useCallback((childNodes) => {
    if (!childNodes || childNodes.length === 0) {
      return { width: 750, height: 220 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    childNodes.forEach(child => {
      const x = child.position?.x || 0;
      const y = child.position?.y || 0;
      const width = child.width || child.style?.width || 200;
      const height = child.height || child.style?.height || 50;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    const padding = 30;
    const headerHeight = 50;

    return {
      width: Math.max(750, maxX - minX + padding * 2),
      height: Math.max(220, maxY - minY + padding + headerHeight)
    };
  }, []);

  // Create stable signatures for object dependencies to prevent infinite loops
  const trainingDataSignature = useMemo(() =>
    JSON.stringify(flowState.trainingData),
    [flowState.trainingData]
  );
  const configSignature = useMemo(() =>
    JSON.stringify(nnState.config),
    [nnState.config.layers, nnState.config.activation, nnState.config.costFunction]
  );
  const trainingConfigSignature = useMemo(() =>
    JSON.stringify(nnState.trainingConfig),
    [nnState.trainingConfig.steps, nnState.trainingConfig.learningRate, nnState.trainingConfig.method]
  );
  // Create stable signature for nodes array to prevent infinite loops
  const nodesSignature = useMemo(() =>
    flowState.nodes?.map(n => `${n.id}|${n.type}|${n.position?.x}|${n.position?.y}`).sort().join('||') || '',
    [flowState.nodes]
  );

  // Create nodes with proper data connections
  // Use useMemo with stable dependencies to prevent excessive recalculations
  const nodesWithData = useMemo(() => {
    if (!flowState.nodes || flowState.nodes.length === 0) {
      return [];
    }

    // Get child nodes for group size calculation
    const childNodes = flowState.nodes.filter(n => n.parentId === 'neural-network');
    const groupSize = flowState.isExpanded ? calculateGroupSize(childNodes) : null;

    return flowState.nodes.map(node => {
      const baseData = node.data || {};

      switch (node.id) {
        case 'training-data':
          return {
            ...node,
            data: {
              ...baseData,
              x: flowState.trainingData.x,
              y: flowState.trainingData.y,
              onUpdate: flowState.updateTrainingData,
            }
          };

        case 'neural-network':
          // When expanded, it's a group node
          if (node.type === 'group') {
            return {
              ...node,
              style: groupSize ? {
                ...node.style,
                width: groupSize.width,
                height: groupSize.height
              } : node.style,
              data: {
                ...baseData,
                isExpanded: flowState.isExpanded,
                onToggle: flowState.toggleExpanded,
                label: 'Neural Network',
                trainingData: flowState.trainingData,
                config: nnState.config,
                trainingConfig: nnState.trainingConfig,
                onNetworkConfigChange: handleConfigUpdate,
                onTrainingConfigChange: handleTrainingConfigUpdate,
                onTrain: handleTrain,
                isTraining: nnState.isTraining,
                currentStep: nnState.currentStep,
                trainingHistory: nnState.trainingHistory,
                isTrained: nnState.isTrained,
              }
            };
          }
          // When collapsed, it's a neural network node
          return {
            ...node,
            data: {
              ...baseData,
              isExpanded: flowState.isExpanded,
              onToggle: flowState.toggleExpanded,
              trainingData: flowState.trainingData,
              config: nnState.config,
              trainingConfig: nnState.trainingConfig,
              onTrain: handleTrain,
              isTraining: nnState.isTraining,
              currentStep: nnState.currentStep,
              trainingHistory: nnState.trainingHistory,
              isTrained: nnState.isTrained,
            }
          };

        case 'prediction':
          return {
            ...node,
            data: {
              ...baseData,
              input: flowState.predictionInput,
              output: flowState.predictionOutput,
              onUpdateInput: flowState.updatePredictionInput,
              isTrained: nnState.isTrained,
            }
          };

        case 'training-progress':
          return {
            ...node,
            data: {
              ...baseData,
              history: nnState.trainingHistory.slice(-100), // Only pass last 100 entries to prevent memory issues
            }
          };

        case 'trained-params':
          return {
            ...node,
            data: {
              ...baseData,
              parameters: nnState.isTrained ? nnState.getParameters() : null,
            }
          };

        case 'forward-pass':
          return {
            ...node,
            data: {
              ...baseData,
              parameters: nnState.isTrained ? nnState.getParameters() : null,
              input: flowState.predictionInput,
              network: nnState.network,
              onOutput: flowState.updatePredictionOutput,
            }
          };

        default:
          // Handle dynamic neuron nodes
          if (node.id && node.id.startsWith('neuron-')) {
            const params = nnState.getParameters();
            const parts = node.id.split('-');
            const layerIndex = parseInt(parts[1]);
            const neuronIndex = parseInt(parts[2]);

            return {
              ...node,
              data: {
                ...baseData,
                layerIndex,
                neuronIndex,
                bias: params?.biases?.[layerIndex]?.[neuronIndex] || 0,
                isInput: layerIndex === 0,
                isOutput: layerIndex === nnState.config.layers.length - 1,
              }
            };
          }
          // Handle dynamic weight and bias nodes (legacy)
          if (node.id && node.id.startsWith('weight-')) {
            const layerIndex = parseInt(node.id.split('-')[1]);
            const params = nnState.getParameters();
            return {
              ...node,
              data: {
                ...baseData,
                layerIndex,
                weights: params?.weights?.[layerIndex] || [],
                fromSize: nnState.config.layers[layerIndex],
                toSize: nnState.config.layers[layerIndex + 1],
              }
            };
          }
          if (node.id && node.id.startsWith('bias-')) {
            const layerIndex = parseInt(node.id.split('-')[1]);
            const params = nnState.getParameters();
            return {
              ...node,
              data: {
                ...baseData,
                layerIndex,
                biases: params?.biases?.[layerIndex] || [],
                size: nnState.config.layers[layerIndex + 1],
              }
            };
          }
          return node;
      }
    });
  }, [
    // Use stable signature instead of array reference
    nodesSignature,
    // Use stable signatures instead of object references
    trainingDataSignature,
    flowState.isExpanded,
    flowState.predictionInput,
    flowState.predictionOutput,
    flowState.toggleExpanded,
    flowState.updateTrainingData,
    flowState.updatePredictionInput,
    flowState.updatePredictionOutput,
    // Use stable signatures instead of object references
    configSignature,
    trainingConfigSignature,
    // Only depend on trainingHistory length, not the full array to prevent excessive updates
    nnState.trainingHistory.length,
    nnState.isTrained,
    nnState.isTraining,
    nnState.currentStep,
    nnState.getParameters,
    handleConfigUpdate,
    handleTrainingConfigUpdate,
    handleTrain,
    handleTrainingStep,
    calculateGroupSize,
  ]);

  // Process edges to add actual weight values
  const edgesWithWeights = useMemo(() => {
    return flowState.edges.map(edge => {
      // Check if this is a neuron-to-neuron edge
      if (edge.id && edge.id.startsWith('edge-')) {
        const parts = edge.id.split('-');
        const layerIdx = parseInt(parts[1]);
        const fromIdx = parseInt(parts[2]);
        const toIdx = parseInt(parts[3]);

        const params = nnState.getParameters();
        const weight = params?.weights?.[layerIdx]?.[toIdx]?.[fromIdx];

        if (weight !== undefined) {
          return {
            ...edge,
            label: `w${layerIdx + 1}${toIdx + 1}${fromIdx + 1} = ${weight.toFixed(2)}`,
            labelStyle: { fill: '#fff', fontSize: 10 },
            labelBgStyle: { fill: '#2a2a2a', fillOpacity: 0.8 }
          };
        }
      }
      return edge;
    });
  }, [flowState.edges, nnState.currentStep, nnState.isTrained, nnState.getParameters]);

  return (
    <div className="app">
      <div className="app-header">
        <h1>Neural Network Flowchart</h1>
        <p>Interactive visualization of neural network training and prediction</p>
      </div>
      <FlowCanvas
        nodes={nodesWithData}
        edges={edgesWithWeights}
        nodeTypes={nodeTypes}
      />
    </div>
  );
}

export default App;
