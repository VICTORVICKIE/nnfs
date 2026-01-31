import { useCallback, useMemo, useState } from 'react';

export function useFlowState(config = { layers: [1, 3, 1] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [trainingData, setTrainingData] = useState({ x: [[1], [2], [3], [4], [5]], y: [[2], [4], [6], [8], [10]] });
  const [predictionInput, setPredictionInput] = useState([3]);
  const [predictionOutput, setPredictionOutput] = useState(null);

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

  // Generate dynamic neuron nodes and edges based on network architecture
  const generateNeuronNodesAndEdges = useCallback((layers) => {
    const nodes = [];
    const edges = [];
    const layerSpacing = 280;
    const neuronSpacing = 100;
    const startX = 20;
    const startY = 200;
    
    // Create neuron nodes for each layer
    layers.forEach((layerSize, layerIndex) => {
      const layerX = startX + layerIndex * layerSpacing;
      const layerStartY = startY - ((layerSize - 1) * neuronSpacing) / 2;
      
      for (let neuronIndex = 0; neuronIndex < layerSize; neuronIndex++) {
        nodes.push({
          id: `neuron-${layerIndex}-${neuronIndex}`,
          type: 'neuron',
          position: { 
            x: layerX, 
            y: layerStartY + neuronIndex * neuronSpacing 
          },
          parentId: 'neurons-group',
          extent: 'parent',
          draggable: false,
          data: { 
            layerIndex, 
            neuronIndex,
            isInput: layerIndex === 0,
            isOutput: layerIndex === layers.length - 1
          },
          style: { width: 60, height: 60 }
        });
      }
    });
    
    // Create edges between neurons with weight labels
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
            style: { stroke: '#666', strokeWidth: 1.5 },
            labelStyle: { fill: '#aaa', fontSize: 9, fontWeight: 500 },
            labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.7 }
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
    
    const { nodes: neuronNodes } = generateNeuronNodesAndEdges(config.layers);
    
    // Calculate neurons group size
    let neuronsMinX = Infinity, neuronsMinY = Infinity, neuronsMaxX = -Infinity, neuronsMaxY = -Infinity;
    neuronNodes.forEach(node => {
      neuronsMinX = Math.min(neuronsMinX, node.position.x);
      neuronsMinY = Math.min(neuronsMinY, node.position.y);
      neuronsMaxX = Math.max(neuronsMaxX, node.position.x + 60);
      neuronsMaxY = Math.max(neuronsMaxY, node.position.y + 60);
    });
    const neuronsPadding = 30;
    const neuronsGroupWidth = neuronsMaxX - neuronsMinX + neuronsPadding * 2;
    const neuronsGroupHeight = neuronsMaxY - neuronsMinY + neuronsPadding * 2;
    
    const childNodes = [
      {
        id: 'neurons-group',
        type: 'simpleGroup',
        position: { x: neuronsMinX - neuronsPadding + 250, y: neuronsMinY - neuronsPadding + 60 },
        parentId: 'neural-network',
        extent: 'parent',
        selectable: false,
        style: {
          width: neuronsGroupWidth,
          height: neuronsGroupHeight,
          backgroundColor: 'rgba(100, 150, 200, 0.03)',
          border: '1px dashed #4a90e2',
          borderRadius: '8px'
        },
        data: {}
      },
      ...neuronNodes
    ];

    return childNodes;
  }, [isExpanded, config.layers, generateNeuronNodesAndEdges]);

  // Calculate group size based on child nodes' bounding box
  // This will auto-adjust when child nodes are resized or moved
  const calculateGroupSize = useCallback((childNodes) => {
    if (!childNodes || childNodes.length === 0) {
      return { width: 750, height: 220 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    childNodes.forEach(node => {
      const x = node.position?.x || 0;
      const y = node.position?.y || 0;
      // Get width/height from node dimensions or style
      const width = node.width || node.measured?.width || node.style?.width || 200;
      const height = node.height || node.measured?.height || node.style?.height || 50;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    // Add padding to ensure children fit comfortably
    const padding = 50;
    const headerHeight = 60; // Height of group header
    
    return {
      width: Math.max(750, maxX - minX + padding * 2),
      height: Math.max(220, maxY - minY + padding * 2 + headerHeight)
    };
  }, []);

  // Calculate group size from expanded nodes
  const groupSize = useMemo(() => {
    if (!isExpanded) {
      return null;
    }
    return calculateGroupSize(expandedNodes);
  }, [isExpanded, expandedNodes, calculateGroupSize]);

  // Calculate node positions for collapsed view (horizontal)
  const collapsedNodes = useMemo(() => [
    {
      id: 'training-data',
      type: 'trainingData',
      position: { x: 50, y: isExpanded ? 80 : 250 },
      data: { 
        x: trainingData.x, 
        y: trainingData.y,
        onUpdate: updateTrainingData
      }
    },
    {
      id: 'neural-network',
      type: isExpanded ? 'group' : 'neuralNetwork',
      position: { x: isExpanded ? 400 : 500, y: isExpanded ? 80 : 200 },
      style: isExpanded && groupSize ? {
        width: groupSize.width || 750,
        height: groupSize.height || 220,
        backgroundColor: 'rgba(100, 100, 100, 0.05)',
        border: '2px solid #646cff',
        borderRadius: '8px'
      } : undefined,
      data: { 
        isExpanded,
        onToggle: toggleExpanded,
        label: 'Neural Network'
      }
    },
    {
      id: 'training-progress',
      type: 'trainingProgress',
      position: { 
        x: isExpanded && groupSize ? 400 + groupSize.width + 50 : 1400, 
        y: isExpanded ? 80 : 50 
      },
      data: {}
    },
    {
      id: 'prediction',
      type: 'prediction',
      position: { 
        x: isExpanded && groupSize ? 400 + groupSize.width + 50 : 1400, 
        y: isExpanded ? 280 : 250 
      },
      data: { 
        input: predictionInput,
        output: predictionOutput,
        onUpdateInput: updatePredictionInput
      }
    }
  ], [isExpanded, trainingData, predictionInput, predictionOutput, toggleExpanded, updateTrainingData, updatePredictionInput, groupSize]);

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
      target: 'training-progress',
      type: 'smoothstep',
      animated: true
    }
  ], []);

  // Expanded view edges
  const expandedEdges = useMemo(() => {
    const { edges: neuronEdges } = generateNeuronNodesAndEdges(config.layers);
    
    const edges = [
      {
        id: 'e1-exp',
        source: 'training-data',
        target: 'neural-network',
        type: 'smoothstep',
        animated: true,
        label: 'training data'
      },
      {
        id: 'e2-exp',
        source: 'neural-network',
        target: 'training-progress',
        type: 'smoothstep',
        animated: true,
        label: 'progress'
      },
      {
        id: 'e3-exp',
        source: 'neural-network',
        target: 'prediction',
        type: 'smoothstep',
        animated: true,
        label: 'predictions'
      },
      ...neuronEdges
    ];
    
    return edges;
  }, [config.layers, generateNeuronNodesAndEdges]);

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
