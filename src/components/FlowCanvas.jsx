import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useRef } from 'react';
import { resolveCollisions } from '../utils/collisionDetection';
import './FlowCanvas.css';

export default function FlowCanvas({ nodes: initialNodes, edges: initialEdges, nodeTypes, edgeTypes, isExpanded }) {
  const hasFitOnMount = useRef(false);
  // Use useNodesState and useEdgesState - React Flow's recommended hooks
  // These manage state internally and provide change handlers
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle collision detection after dragging
  const onNodeDragStop = useCallback(() => {
    setNodes((nds) =>
      resolveCollisions(nds, {
        maxIterations: 50,
        overlapThreshold: 0.5,
        margin: 15,
      })
    );
  }, [setNodes]);

  // Only sync nodes on STRUCTURAL changes (expand/collapse), not data updates
  // This prevents resetting user-modified positions/sizes during training
  const prevIsExpandedRef = useRef(isExpanded);
  const prevNodeIdsRef = useRef(new Set());
  const prevNeuronPositionsRef = useRef(new Map());

  useEffect(() => {
    const prevNodeIds = prevNodeIdsRef.current;
    const newNodeIds = new Set(initialNodes.map(n => n.id));

    // Check if node structure changed (different IDs or count)
    const structureChanged =
      prevNodeIds.size !== newNodeIds.size ||
      ![...prevNodeIds].every(id => newNodeIds.has(id)) ||
      ![...newNodeIds].every(id => prevNodeIds.has(id));

    // Check if neuron positions changed (group was resized)
    const prevNeuronPositions = prevNeuronPositionsRef.current;
    const neuronPositionsChanged = initialNodes.some(node => {
      if (node.parentId === 'neural-network') {
        const prevPos = prevNeuronPositions.get(node.id);
        if (prevPos) {
          return prevPos.x !== node.position.x || prevPos.y !== node.position.y;
        }
        return true; // New neuron node
      }
      return false;
    });

    // Reset nodes when:
    // 1. Expand/collapse state changes
    // 2. Node structure changes (layers config changed, nodes added/removed)
    // 3. Neuron positions changed (group was resized)
    if (prevIsExpandedRef.current !== isExpanded || structureChanged || neuronPositionsChanged) {
      prevIsExpandedRef.current = isExpanded;
      prevNodeIdsRef.current = newNodeIds;
      
      // Update neuron positions cache
      const newNeuronPositions = new Map();
      initialNodes.forEach(node => {
        if (node.parentId === 'neural-network') {
          newNeuronPositions.set(node.id, { x: node.position.x, y: node.position.y });
        }
      });
      prevNeuronPositionsRef.current = newNeuronPositions;
      
      setNodes(initialNodes);
    } else {
      // Update only node data without changing positions/dimensions
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const updatedNode = initialNodes.find((n) => n.id === node.id);
          if (updatedNode) {
            return {
              ...node,
              data: updatedNode.data, // Update data only
              type: updatedNode.type, // Update type in case of expand/collapse
            };
          }
          return node;
        })
      );
    }
  }, [isExpanded, initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  return (
    <div className="flow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        snapToGrid={true}
        snapGrid={[15, 15]}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        connectionLineStyle={{ stroke: '#fff', strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#888', strokeWidth: 2 }
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
