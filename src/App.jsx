import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import ConceptDialog from './components/ConceptDialog';
import ReferencesDialog from './components/ReferencesDialog';
import WeightEdge from './components/edges/WeightEdge';
import FlowCanvas from './components/FlowCanvas';
import BiasNode from './components/nodes/BiasNode';
import ForwardPassNode from './components/nodes/ForwardPassNode';
import GroupNode from './components/nodes/GroupNode';
import LearningProgressNode from './components/nodes/LearningProgressNode';
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
import {
  selectConfig,
  selectIsTrained,
  selectIsTraining,
  selectParameters,
  selectTrainingConfig,
  selectTrainingData,
  selectUpdatePredictionInput,
  useNeuralNetworkStore,
} from './stores/neuralNetworkStore';

const nodeTypes = {
  trainingData: TrainingDataNode,
  neuralNetwork: NeuralNetworkNode,
  prediction: PredictionNode,
  trainingLoop: TrainingLoopNode,
  trainingProgress: TrainingProgressNode,
  learningProgress: LearningProgressNode,
  trainedParameters: TrainedParametersNode,
  forwardPass: ForwardPassNode,
  weight: WeightNode,
  bias: BiasNode,
  neuron: NeuronNode,
  group: GroupNode,
  simpleGroup: SimpleGroupNode,
};

const edgeTypes = {
  default: WeightEdge,
  smoothstep: WeightEdge,
  straight: WeightEdge,
};

function App() {
  const [currentConcept, setCurrentConcept] = useState(null);
  const [showReferences, setShowReferences] = useState(false);

  // Get config from Zustand store
  const config = useNeuralNetworkStore(selectConfig);
  const trainingConfig = useNeuralNetworkStore(selectTrainingConfig);
  const isTrained = useNeuralNetworkStore(selectIsTrained);
  const isTraining = useNeuralNetworkStore(selectIsTraining);
  const parameters = useNeuralNetworkStore(selectParameters);

  // Use neural network hook (syncs with Zustand internally)
  const nnState = useNeuralNetwork();
  const flowState = useFlowState(config);

  // Get store actions
  const updatePredictionInput = useNeuralNetworkStore(selectUpdatePredictionInput);

  // Sync flow state prediction input to store
  useEffect(() => {
    updatePredictionInput(flowState.predictionInput);
  }, [flowState.predictionInput, updatePredictionInput]);

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

  // Handle cancel training
  const handleCancelTraining = useCallback(() => {
    nnState.cancelTraining();
  }, [nnState.cancelTraining]);

  // Handle prediction
  const handlePredict = useCallback(() => {
    const predictionInput = flowState.predictionInput;

    // Parse input
    const parseInput = (val) => {
      if (typeof val === 'string') {
        return val.split(',').map(v => parseFloat(v.trim())).filter(n => !isNaN(n));
      }
      if (Array.isArray(val)) {
        return val;
      }
      return [val];
    };

    const parsedInput = parseInput(predictionInput);

    if (parsedInput.length === 0) {
      console.error('Please enter a valid input value');
      return;
    }

    // Make prediction
    const output = nnState.predict(parsedInput);
    flowState.updatePredictionOutput(output);
  }, [flowState.predictionInput, flowState.updatePredictionOutput, nnState.predict]);

  // Handle training completion
  const handleTrain = useCallback(async (onStep) => {
    // Read latest training data directly from Zustand store
    const { x, y } = useNeuralNetworkStore.getState().trainingData;

    // Validate training data exists
    if (!x || !y || !Array.isArray(x) || !Array.isArray(y)) {
      console.error('Invalid training data: x and y must be arrays');
      return;
    }

    if (x.length === 0 || y.length === 0) {
      console.error('Training data is empty. Please add training samples in the Training Data node.');
      return;
    }

    // Parse raw strings into arrays of numbers
    const parseInput = (val) => {
      if (typeof val === 'string') {
        const parsed = val.split(',').map(v => {
          const num = parseFloat(v.trim());
          return isNaN(num) ? 0 : num;
        });
        // Filter out empty strings that result in [0]
        return parsed.length > 0 ? parsed : [];
      }
      if (Array.isArray(val)) {
        return val;
      }
      // Single number
      return [val];
    };

    const parsedX = x.map(parseInput).filter(arr => arr.length > 0);
    const parsedY = y.map(parseInput).filter(arr => arr.length > 0);

    if (parsedX.length === 0 || parsedY.length === 0) {
      console.error('Training data is empty after parsing. Please check your input values.');
      return;
    }

    if (parsedX.length !== parsedY.length) {
      console.error(`Training data mismatch: ${parsedX.length} inputs but ${parsedY.length} outputs. They must match.`);
      return;
    }

    // Validate that all samples are arrays of numbers
    for (let i = 0; i < parsedX.length; i++) {
      if (!Array.isArray(parsedX[i]) || parsedX[i].some(v => typeof v !== 'number' || isNaN(v))) {
        console.error(`Invalid input at sample ${i + 1}: must be comma-separated numbers`);
        return;
      }
      if (!Array.isArray(parsedY[i]) || parsedY[i].some(v => typeof v !== 'number' || isNaN(v))) {
        console.error(`Invalid output at sample ${i + 1}: must be comma-separated numbers`);
        return;
      }
    }

    // Auto-detect input and output dimensions from data
    const actualInputSize = parsedX[0].length;
    const actualOutputSize = parsedY[0].length;
    const hiddenLayers = config.hiddenLayers || [];

    // Build full architecture: input + hidden + output
    const fullLayers = [actualInputSize, ...hiddenLayers, actualOutputSize];

    console.log('[handleTrain] Building network architecture:');
    console.log('[handleTrain]   Input size:', actualInputSize, '(from training data)');
    console.log('[handleTrain]   Hidden layers:', hiddenLayers);
    console.log('[handleTrain]   Output size:', actualOutputSize, '(from training data)');
    console.log('[handleTrain]   Full architecture:', fullLayers);
    console.log('[handleTrain]   Activation:', config.activation);
    console.log('[handleTrain]   Cost function:', config.costFunction);

    await nnState.train(parsedX, parsedY, onStep, fullLayers);
  }, [nnState, config]);

  // Update prediction when forward pass completes or input changes
  useEffect(() => {
    if (isTrained && flowState.predictionInput) {
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
    } else if (!isTrained) {
      flowState.updatePredictionOutput(null);
    }
  }, [isTrained, flowState.predictionInput, nnState.predict, flowState.updatePredictionOutput]);

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
      width: Math.max(1000, maxX - minX + padding * 2),
      height: Math.max(220, maxY - minY + padding + headerHeight)
    };
  }, []);

  // Create stable signatures for object dependencies to prevent infinite loops
  const trainingDataSignature = useMemo(() =>
    JSON.stringify(flowState.trainingData),
    [flowState.trainingData]
  );
  const configSignature = useMemo(() =>
    JSON.stringify(config),
    [config.hiddenLayers, config.activation, config.costFunction]
  );
  const trainingConfigSignature = useMemo(() =>
    JSON.stringify(trainingConfig),
    [trainingConfig.steps, trainingConfig.learningRate, trainingConfig.method]
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
              openConceptDialog: setCurrentConcept,
            }
          };

        case 'neural-network':
          // When expanded, it's a group node
          if (node.type === 'group') {
            return {
              ...node,
              data: {
                ...baseData,
                isExpanded: flowState.isExpanded,
                onToggle: flowState.toggleExpanded,
                onResize: flowState.updateGroupSize,
                minGroupSize: flowState.minGroupSize,
                label: 'Neural Network',
                config: config,
                trainingConfig: trainingConfig,
                onNetworkConfigChange: handleConfigUpdate,
                onTrainingConfigChange: handleTrainingConfigUpdate,
                onTrain: handleTrain,
                onCancelTraining: handleCancelTraining,
                isTraining: isTraining,
                openConceptDialog: setCurrentConcept,
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
              config: config,
              trainingConfig: trainingConfig,
              onTrain: handleTrain,
              onCancelTraining: handleCancelTraining,
              isTraining: isTraining,
              openConceptDialog: setCurrentConcept,
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
              onPredict: handlePredict,
              isTrained: isTrained,
              openConceptDialog: setCurrentConcept,
            }
          };

        case 'training-progress':
          // Now reads from context, no data needed
          return {
            ...node,
            data: {
              ...baseData,
              openConceptDialog: setCurrentConcept,
            }
          };

        case 'learning-progress':
          // Now reads from context and computes predictions itself
          return {
            ...node,
            data: {
              ...baseData,
              onHeaderClick: () => setCurrentConcept('learning-progress')
            }
          };

        case 'trained-params':
          return {
            ...node,
            data: {
              ...baseData,
              parameters: isTrained ? parameters : null,
            }
          };

        case 'forward-pass':
          return {
            ...node,
            data: {
              ...baseData,
              parameters: isTrained ? parameters : null,
              input: flowState.predictionInput,
              network: nnState.network,
              onOutput: flowState.updatePredictionOutput,
            }
          };

        default:
          // Handle dynamic neuron nodes - bias now read from context
          if (node.id && node.id.startsWith('neuron-')) {
            const parts = node.id.split('-');
            const layerIndex = parseInt(parts[1]);
            const neuronIndex = parseInt(parts[2]);

            return {
              ...node,
              data: {
                ...baseData,
                layerIndex,
                neuronIndex,
                isInput: layerIndex === 0,
                isOutput: layerIndex === (config.hiddenLayers || []).length + 1,
              }
            };
          }
          // Handle dynamic weight and bias nodes (legacy)
          if (node.id && node.id.startsWith('weight-')) {
            const layerIndex = parseInt(node.id.split('-')[1]);
            return {
              ...node,
              data: {
                ...baseData,
                layerIndex,
                weights: parameters?.weights?.[layerIndex] || [],
                fromSize: 1,  // Will be determined at training time
                toSize: 1,
              }
            };
          }
          if (node.id && node.id.startsWith('bias-')) {
            const layerIndex = parseInt(node.id.split('-')[1]);
            return {
              ...node,
              data: {
                ...baseData,
                layerIndex,
                biases: parameters?.biases?.[layerIndex] || [],
                size: 1,  // Will be determined at training time
              }
            };
          }
          return node;
      }
    });
  }, [
    // STRUCTURAL DEPENDENCIES ONLY - only recreate when layout/structure changes
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
    flowState.updateGroupSize,
    flowState.groupSize,
    flowState.minGroupSize,
    // Use stable signatures instead of object references
    configSignature,
    trainingConfigSignature,
    // Zustand state - stable references
    isTrained,
    parameters,
    config,
    trainingConfig,
    // Actions
    handleConfigUpdate,
    handleTrainingConfigUpdate,
    handleTrain,
    handlePredict,
    handleTrainingStep,
    nnState.network,
  ]);

  // Edges with weight labels handled by custom WeightEdge component
  // No need to recreate edges on training updates - component reads from Zustand
  const edges = useMemo(() => flowState.edges, [flowState.edges]);

  return (
    <>
      <div className="app">
        <div className="app-header">
          <div className="header-left">
            <img src="logo.png" alt="Logo" className="app-logo" />
            <div>
              <h1>Neural Network From Scratch</h1>
              <p>Visualization by Vignesh Kumar S</p>
            </div>
          </div>
          <div className="header-right">
            <p>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setShowReferences(true); }}
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
              >
                References
              </a>
            </p>
          </div>
        </div>
        <FlowCanvas
          nodes={nodesWithData}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          isExpanded={flowState.isExpanded}
        />
      </div>

      {currentConcept && (
        <ConceptDialog
          conceptKey={currentConcept}
          onClose={() => setCurrentConcept(null)}
        />
      )}

      {showReferences && (
        <ReferencesDialog
          onClose={() => setShowReferences(false)}
        />
      )}
    </>
  );
}

export default App;
