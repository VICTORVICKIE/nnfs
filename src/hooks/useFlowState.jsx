import { useCallback, useEffect, useMemo, useState } from 'react';

export function useFlowState(config = { hiddenLayers: [3] }) {
  // Calculate minimum group size based on network architecture
  const calculateMinimumGroupSize = useCallback((layers) => {
    const layerSpacing = 280;
    const neuronSpacing = 100;
    const neuronSize = 60;
    const padding = 50;
    const headerHeight = 120;

    const totalWidth = (layers.length - 1) * layerSpacing + neuronSize + (padding * 2);
    const maxLayerSize = layers.reduce((max, size) => Math.max(max, size), 0);
    const totalHeight = (maxLayerSize - 1) * neuronSpacing + neuronSize + padding + headerHeight;

    return {
      width: Math.max(1000, totalWidth),
      height: Math.max(220, totalHeight)
    };
  }, []);

  const [isExpanded, setIsExpanded] = useState(false);
  const [minGroupSize, setMinGroupSize] = useState({ width: 1000, height: 600 });
  const [groupSize, setGroupSize] = useState({ width: 1000, height: 600 });
  const [trainingData, setTrainingData] = useState({ x: [[1], [2], [3], [4], [5]], y: [[2], [4], [6], [8], [10]] });
  const [predictionInput, setPredictionInput] = useState([7]);
  const [predictionOutput, setPredictionOutput] = useState(null);

  // Build full layers from hidden layers + default input/output for visualization
  const getFullLayers = useCallback(() => {
    const hiddenLayers = config.hiddenLayers || [3];
    // Default to 1 input, 1 output for visualization (will be corrected during training)
    return [1, ...hiddenLayers, 1];
  }, [config.hiddenLayers]);

  // Recalculate minimum and actual group size when hidden layers change
  useEffect(() => {
    const fullLayers = getFullLayers();
    const minSize = calculateMinimumGroupSize(fullLayers);
    setMinGroupSize(minSize);
    setGroupSize(minSize);
  }, [config.hiddenLayers, getFullLayers, calculateMinimumGroupSize]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const updateTrainingData = useCallback((data) => {
    setTrainingData(data);
  }, []);

  const updatePredictionInput = useCallback((input) => {
    setPredictionInput(input);
  }, []);

  const updatePredictionOutput = useCallback((output) => {
    setPredictionOutput(output);
  }, []);

  const updateGroupSize = useCallback((size) => {
    // Enforce minimum dimensions
    setGroupSize({
      width: Math.max(size.width, minGroupSize.width),
      height: Math.max(size.height, minGroupSize.height)
    });
  }, [minGroupSize]);

  // Generate dynamic neuron nodes and edges based on network architecture
  const generateNeuronNodesAndEdges = useCallback((layers, parentSize = { width: 1000, height: 600 }) => {
    const nodes = [];
    const edges = [];
    const layerSpacing = 280;
    const neuronSpacing = 100;
    const neuronSize = 60;
    const headerHeight = 56; // Height reserved for group header controls
    
    // Calculate total dimensions of the neural graph
    const totalWidth = (layers.length - 1) * layerSpacing + neuronSize;
    const maxLayerSize = layers.reduce((max, size) => Math.max(max, size), 0);
    const totalHeight = (maxLayerSize - 1) * neuronSpacing + neuronSize;
    
    // Parent container size (from parameter or default)
    const parentWidth = parentSize.width || 1000;
    const parentHeight = parentSize.height || 600;
    
    // Calculate centering offsets (accounting for header)
    const availableHeight = parentHeight - headerHeight;
    const startX = (parentWidth - totalWidth) / 2;
    const startY = headerHeight + (availableHeight - totalHeight) / 2;

    // Create neuron nodes for each layer
    layers.forEach((layerSize, layerIndex) => {
      const layerX = startX + layerIndex * layerSpacing;
      const layerStartY = startY + ((maxLayerSize - layerSize) * neuronSpacing) / 2;

      for (let neuronIndex = 0; neuronIndex < layerSize; neuronIndex++) {
        nodes.push({
          id: `neuron-${layerIndex}-${neuronIndex}`,
          type: 'neuron',
          position: {
            x: layerX,
            y: layerStartY + neuronIndex * neuronSpacing
          },
          parentId: 'neural-network',
          extent: 'parent',
          draggable: false,
          data: {
            layerIndex,
            neuronIndex,
            isInput: layerIndex === 0,
            isOutput: layerIndex === layers.length - 1
          },
          style: { width: neuronSize, height: neuronSize }
        });
      }
    });

    // Create edges between neurons with weight labels
    // Position labels at the start (source) to avoid overlap in the middle
    for (let i = 0; i < layers.length - 1; i++) {
      const fromLayerSize = layers[i];
      const toLayerSize = layers[i + 1];

      for (let fromIdx = 0; fromIdx < fromLayerSize; fromIdx++) {
        for (let toIdx = 0; toIdx < toLayerSize; toIdx++) {
          edges.push({
            id: `edge-${i}-${fromIdx}-${toIdx}`,
            source: `neuron-${i}-${fromIdx}`,
            target: `neuron-${i + 1}-${toIdx}`,
            type: 'straight',
            animated: false,
            label: `w${i + 1}${toIdx + 1}${fromIdx + 1}`,
            labelPosition: 0.15, // Position label at 15% from source (near start)
            labelStyle: { fill: '#bbb', fontSize: 8, fontWeight: 500 },
            labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.9, rx: 2, ry: 2 },
            labelBgPadding: [2, 4],
            style: { stroke: '#666', strokeWidth: 1.5, zIndex: "10" },
          });
        }
      }
    }

    return { nodes, edges };
  }, []);

  // Generate dynamic weight and bias nodes based on network architecture (OLD APPROACH - KEPT FOR BACKWARD COMPATIBILITY)
  const generateLayerNodes = useCallback((layers) => {
    const nodes = [];
    const columnWidth = 200;
    const rowHeight = 70;
    const startX = 20;
    const startY = 60;

    // For each layer transition, create weight and bias nodes
    for (let i = 0; i < layers.length - 1; i++) {
      const fromSize = layers[i];
      const toSize = layers[i + 1];
      const columnX = startX + (i + 1) * columnWidth;

      // Weight node
      nodes.push({
        id: `weight-${i}`,
        type: 'weight',
        position: { x: columnX, y: startY },
        parentId: 'neural-network',
        extent: 'parent',
        data: { layerIndex: i, fromSize, toSize },
        style: { width: 150, height: 50 }
      });

      // Bias node
      nodes.push({
        id: `bias-${i}`,
        type: 'bias',
        position: { x: columnX, y: startY + rowHeight },
        parentId: 'neural-network',
        extent: 'parent',
        data: { layerIndex: i, size: toSize },
        style: { width: 150, height: 50 }
      });
    }

    return nodes;
  }, []);

  // Calculate node positions for expanded view (internal nodes as children of group)
  // Arranged in a neat grid layout
  const expandedNodes = useMemo(() => {
    if (!isExpanded) return [];

    const fullLayers = getFullLayers();
    const { nodes: neuronNodes } = generateNeuronNodesAndEdges(fullLayers, groupSize);

    return neuronNodes;
  }, [isExpanded, getFullLayers, generateNeuronNodesAndEdges, groupSize]);


  // Calculate node positions for collapsed view (horizontal)
  const collapsedNodes = useMemo(() => [
    {
      id: 'training-data',
      type: 'trainingData',
      position: { x: -200, y: isExpanded ? 80 : 150 },
      data: {
        x: trainingData.x,
        y: trainingData.y,
        onUpdate: updateTrainingData
      }
    },
    {
      id: 'neural-network',
      type: isExpanded ? 'group' : 'neuralNetwork',
      position: { x: isExpanded ? 400 : 450, y: isExpanded ? 80 : 100 },
      style: isExpanded ? {
        width: groupSize.width || 1000,
        height: groupSize.height || 600,
        backgroundColor: 'rgba(100, 100, 100, 0.05)',
        border: '2px solid #646cff',
        borderRadius: '8px'
      } : undefined,
      data: {
        isExpanded,
        onToggle: toggleExpanded,
        onResize: updateGroupSize,
        minGroupSize: isExpanded ? minGroupSize : undefined,
        label: 'Neural Network'
      }
    },
    {
      id: 'training-progress',
      type: 'trainingProgress',
      position: {
        x: isExpanded ? 50 : 50,
        y: isExpanded && groupSize ? 150 + groupSize.height + 50 : 500
      },
      style: {
        width: 350,
        height: 350
      },
      data: {}
    },
    {
      id: 'learning-progress',
      type: 'learningProgress',
      position: {
        x: isExpanded ? 430 : 450,
        y: isExpanded && groupSize ? 150 + groupSize.height + 50 : 500
      },
      style: {
        width: 380,
        height: 380
      },
      data: {}
    },
    {
      id: 'prediction',
      type: 'prediction',
      position: {
        x: isExpanded && groupSize ? 400 + groupSize.width + 50 : 900,
        y: isExpanded ? 80 : 200
      },
      data: {
        input: predictionInput,
        output: predictionOutput,
        onUpdateInput: updatePredictionInput
      }
    }
  ], [isExpanded, groupSize, minGroupSize, trainingData, predictionInput, predictionOutput, toggleExpanded, updateGroupSize, updateTrainingData, updatePredictionInput]);

  // Collapsed view edges
  const collapsedEdges = useMemo(() => [
    {
      id: 'e1',
      source: 'training-data',
      target: 'neural-network',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'e2',
      source: 'neural-network',
      target: 'prediction',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'e3',
      source: 'neural-network',
      sourceHandle: 'bottom-left',
      target: 'training-progress',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'e4',
      source: 'neural-network',
      sourceHandle: 'bottom-right',
      target: 'learning-progress',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    }
  ], []);

  // Expanded view edges
  const expandedEdges = useMemo(() => {
    const fullLayers = getFullLayers();
    const { edges: neuronEdges } = generateNeuronNodesAndEdges(fullLayers, groupSize);

    const edges = [
      {
        id: 'e1-exp',
        source: 'training-data',
        target: 'neural-network',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'e2-exp',
        source: 'neural-network',
        sourceHandle: 'bottom-left',
        target: 'training-progress',
        targetHandle: 'input',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'e3-exp',
        source: 'neural-network',
        target: 'prediction',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'e4-exp',
        source: 'neural-network',
        sourceHandle: 'bottom-right',
        target: 'learning-progress',
        targetHandle: 'input',
        type: 'smoothstep',
        animated: true
      },
      ...neuronEdges
    ];

    return edges;
  }, [getFullLayers, generateNeuronNodesAndEdges, groupSize]);

  // Get current nodes and edges based on expanded state
  const nodes = useMemo(() => {
    if (isExpanded) {
      return [...collapsedNodes, ...expandedNodes];
    }
    return collapsedNodes;
  }, [isExpanded, collapsedNodes, expandedNodes]);

  const edges = useMemo(() => {
    if (isExpanded) {
      return expandedEdges;
    }
    return collapsedEdges;
  }, [isExpanded, collapsedEdges, expandedEdges]);

  return {
    isExpanded,
    toggleExpanded,
    groupSize,
    minGroupSize,
    updateGroupSize,
    trainingData,
    updateTrainingData,
    predictionInput,
    updatePredictionInput,
    predictionOutput,
    updatePredictionOutput,
    nodes,
    edges
  };
}
