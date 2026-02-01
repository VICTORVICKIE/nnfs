import { useCallback, useEffect, useRef } from 'react';
import {
  selectAddTrainingHistory,
  selectConfig,
  selectResetTrainingHistory,
  selectSetCurrentStep,
  selectSetIsTrained,
  selectSetIsTraining,
  selectSetNetworkRef,
  selectTrainingConfig,
  selectUpdateConfig,
  selectUpdateParameters,
  selectUpdateTrainingConfig,
  useNeuralNetworkStore,
} from '../stores/neuralNetworkStore';
import { NeuralNetwork } from '../utils/neuralNetwork';

export function useNeuralNetwork() {
  // Use Zustand selectors - only subscribes to what we need
  const config = useNeuralNetworkStore(selectConfig);
  const trainingConfig = useNeuralNetworkStore(selectTrainingConfig);
  const setIsTraining = useNeuralNetworkStore(selectSetIsTraining);
  const setIsTrained = useNeuralNetworkStore(selectSetIsTrained);
  const setCurrentStep = useNeuralNetworkStore(selectSetCurrentStep);
  const addTrainingHistory = useNeuralNetworkStore(selectAddTrainingHistory);
  const resetTrainingHistory = useNeuralNetworkStore(selectResetTrainingHistory);
  const updateConfig = useNeuralNetworkStore(selectUpdateConfig);
  const updateTrainingConfig = useNeuralNetworkStore(selectUpdateTrainingConfig);
  const updateParameters = useNeuralNetworkStore(selectUpdateParameters);
  const setNetworkRef = useNeuralNetworkStore(selectSetNetworkRef);
  
  const networkRef = useRef(null);

  // Initialize or update network when config changes
  const initializeNetwork = useCallback(() => {
    const nn = new NeuralNetwork(
      config.layers,
      config.activation,
      config.costFunction
    );
    networkRef.current = nn;
    setNetworkRef(nn);
    setIsTrained(false);
  }, [config, setNetworkRef, setIsTrained]);

  // Train the network
  const train = useCallback(async (x, y, onStepCallback) => {
    if (!networkRef.current) {
      initializeNetwork();
    }
    
    setIsTraining(true);
    setCurrentStep(0);
    resetTrainingHistory();

    // Use requestAnimationFrame to batch updates and prevent infinite loops
    let lastUpdateTime = 0;
    const updateInterval = 100; // Update UI every 100ms for smoother performance

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
            // Log every 10th step or first/last step
            if (step % 10 === 0 || step === 0 || step === trainingConfig.steps - 1) {
              console.log(`[Training] Step ${step}:`, {
                loss: loss.toFixed(6),
                weights: parameters.weights?.map(w => 
                  w?.map(row => row?.map(v => v?.toFixed(3)))
                ),
                biases: parameters.biases?.map(b => b?.map(v => v?.toFixed(3)))
              });
            }
            setCurrentStep(step);
            addTrainingHistory(step, loss);
            updateParameters(parameters);
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
      updateParameters(networkRef.current.getParameters());
      return history;
    } catch (error) {
      console.error('Training error:', error);
      throw error;
    } finally {
      setIsTraining(false);
    }
  }, [trainingConfig.steps, trainingConfig.learningRate, trainingConfig.method, initializeNetwork, setIsTraining, setCurrentStep, resetTrainingHistory, addTrainingHistory, updateParameters, setIsTrained]);

  // Predict using trained network
  const predict = useCallback((x) => {
    if (!networkRef.current) {
      return null;
    }
    return networkRef.current.predict(x);
  }, []);

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
  }, [initializeNetwork]);

  // Re-initialize when config changes
  useEffect(() => {
    if (networkRef.current) {
      initializeNetwork();
    }
  }, [config.layers, config.activation, config.costFunction, initializeNetwork]);

  return {
    train,
    predict,
    getParameters,
    initializeNetwork,
    updateConfig,
    updateTrainingConfig,
  };
}
