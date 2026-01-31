import { useCallback, useEffect, useRef, useState } from 'react';
import { NeuralNetwork } from '../utils/neuralNetwork';

export function useNeuralNetwork() {
  const [network, setNetwork] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [config, setConfig] = useState({
    layers: [1, 3, 1],
    activation: 'relu',
    costFunction: 'mse'
  });
  const [trainingConfig, setTrainingConfig] = useState({
    steps: 100,
    learningRate: 0.01,
    method: 'backpropagation'
  });
  const networkRef = useRef(null);

  // Initialize or update network when config changes
  const initializeNetwork = useCallback(() => {
    const nn = new NeuralNetwork(
      config.layers,
      config.activation,
      config.costFunction
    );
    networkRef.current = nn;
    setNetwork(nn);
    setIsTrained(false);
  }, [config]);

  // Update configuration (invalidates training)
  const updateConfig = useCallback((newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    setIsTrained(false);
  }, []);

  // Update training configuration (invalidates training)
  const updateTrainingConfig = useCallback((newTrainingConfig) => {
    setTrainingConfig(prev => ({ ...prev, ...newTrainingConfig }));
    setIsTrained(false);
  }, []);

  // Train the network
  const train = useCallback(async (x, y, onStepCallback) => {
    if (!networkRef.current) {
      initializeNetwork();
    }
    
    setIsTraining(true);
    setCurrentStep(0);
    setTrainingHistory([]);

    // Use requestAnimationFrame to batch updates and prevent infinite loops
    let lastUpdateTime = 0;
    const updateInterval = 50; // Update UI every 50ms max

    try {
      const history = await networkRef.current.train(
        x,
        y,
        trainingConfig.steps,
        trainingConfig.learningRate,
        trainingConfig.method,
        async (step, loss, parameters) => {
          const now = Date.now();
          // Throttle UI updates to prevent excessive re-renders
          if (now - lastUpdateTime >= updateInterval || step === 0 || step === trainingConfig.steps - 1) {
            setCurrentStep(step);
            setTrainingHistory(prev => {
              // Only keep last 100 entries to prevent memory issues
              const newHistory = [...prev, { step, loss }];
              return newHistory.slice(-100);
            });
            lastUpdateTime = now;
            
            if (onStepCallback) {
              // Use setTimeout to defer callback and prevent blocking
              await new Promise(resolve => setTimeout(resolve, 0));
              await onStepCallback(step, loss, parameters);
            }
          }
        }
      );

      // Final update
      setCurrentStep(trainingConfig.steps - 1);
      setIsTrained(true);
      return history;
    } catch (error) {
      console.error('Training error:', error);
      throw error;
    } finally {
      setIsTraining(false);
    }
  }, [trainingConfig.steps, trainingConfig.learningRate, trainingConfig.method, initializeNetwork]);

  // Predict using trained network
  const predict = useCallback((x) => {
    if (!networkRef.current || !isTrained) {
      return null;
    }
    return networkRef.current.predict(x);
  }, [isTrained]);

  // Get current parameters
  const getParameters = useCallback(() => {
    if (!networkRef.current) {
      return null;
    }
    return networkRef.current.getParameters();
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!networkRef.current) {
      initializeNetwork();
    }
  }, []); // Only run on mount

  // Re-initialize when config changes
  useEffect(() => {
    if (networkRef.current) {
      initializeNetwork();
    }
  }, [config.layers, config.activation, config.costFunction]); // Only depend on config values

  return {
    network,
    isTraining,
    isTrained,
    currentStep,
    trainingHistory,
    config,
    trainingConfig,
    updateConfig,
    updateTrainingConfig,
    train,
    predict,
    getParameters,
    initializeNetwork
  };
}
