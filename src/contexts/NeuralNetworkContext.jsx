import { createContext, useContext } from 'react';

// Context to share neural network state across components
// Avoids prop drilling and allows nodes to subscribe to training updates
const NeuralNetworkContext = createContext(null);

export function NeuralNetworkProvider({ children, value }) {
    return (
        <NeuralNetworkContext.Provider value={value}>
            {children}
        </NeuralNetworkContext.Provider>
    );
}

export function useNeuralNetworkContext() {
    const context = useContext(NeuralNetworkContext);
    if (!context) {
        throw new Error('useNeuralNetworkContext must be used within NeuralNetworkProvider');
    }
    return context;
}
