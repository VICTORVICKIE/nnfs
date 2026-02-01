export const conceptExplanations = {
  'neural-network': {
    title: 'Neural Network (Overview)',
    explanation: `
      <p>
        A neural network is like an <strong>assembly line for decisions</strong>.
        Data goes in, gets refined step by step, and a result comes out.
      </p>
      <p>
        Each step adjusts the data slightly to get closer to the right answer.
        Think of it as multiple reviewers improving a document, where each layer
        learns a slightly better version of the data.
      </p>
      <p>
        At its core, it's just: <code>output = input × weight + bias</code>
      </p>
    `,
    codeSnippet: `// Training data: input → output
const train = [[0,0], [1,2], [2,4], [3,6], [4,8]];

// Initialize weight randomly
let w = Math.random() * 10;
let learningRate = 0.1;

// Training loop: adjust weight to minimize cost
for (let step = 0; step < 50; step++) {
  // cost() - measures how wrong we are (will be discussed soon)
  // gradient - tells us how to adjust w (will be discussed soon)
  
  let gradient = calculateGradient(w, train);
  w -= learningRate * gradient;
  
  console.log(\`Step \${step}: cost = \${cost(w)}, w = \${w}\`);
}`,
    fileReference: 'src/utils/neuralNetwork.js',
  },

  'hidden-layer': {
    title: 'Hidden Layers',
    explanation: `
      <p>
        Hidden layers are the <strong>thinking steps</strong> between input and output.
        Each layer learns a slightly better version of the data, like having multiple
        reviewers improve a document before the final version.
      </p>
      <p>
        The more hidden layers you have, the more complex patterns your network can learn.
        Each neuron in these layers transforms the data: <code>neuronOutput = activate(input × weight + bias)</code>
      </p>
    `,
    codeSnippet: `// Example: 2 hidden layers
[2, 4, 3, 1];`,
    fileReference: 'src/utils/neuralNetwork.js',
  },

  'activation': {
    title: 'Activation Functions',
    explanation: `
      <p>
        Activation functions decide <strong>what information matters</strong>.
        Without them, the network would behave too simply, just like a basic calculator.
      </p>
      <p>
        Think of it as a filter that blocks weak signals. The most common one is ReLU,
        which simply keeps positive values and removes negative ones: <code>ReLU(x) = max(0, x)</code>
      </p>
    `,
    codeSnippet: `// ReLU activation
Math.max(0, value);`,
    fileReference: 'src/utils/neuralNetwork.js',
  },

  'training-data': {
    title: 'Training Data',
    explanation: `
      <p>
        Training data is a list of <strong>examples with correct answers</strong>.
        The network learns by comparing its guess to the real answer, like practicing
        questions with answer keys.
      </p>
      <p>
        Each example shows what input should produce what output. The more examples
        you have, the better your network learns the pattern.
      </p>
    `,
    codeSnippet: `// Twice dataset (f(x) = 2x)
x: [[1], [2], [3], [4], [5], [6], [7], [8]]
y: [[2], [4], [6], [8], [10], [12], [14], [16]]`,
    fileReference: 'TrainingDataNode.jsx',
  },

  'cost': {
    title: 'Cost (Loss)',
    explanation: `
      <p>
        Cost tells us <strong>how wrong the prediction is</strong>. Lower cost means
        a better model, like measuring distance from a bullseye.
      </p>
      <p>
        During training, we try to make this number as small as possible. It's
        calculated by comparing predictions to actual answers: <code>error = prediction − answer</code>
      </p>
    `,
    codeSnippet: `// Mean Squared Error (simplified)
(predicted - actual) ** 2;`,
    fileReference: 'src/utils/neuralNetwork.js',
  },

  'learning-rate': {
    title: 'Learning Rate',
    explanation: `
      <p>
        Learning rate controls <strong>how big each correction is</strong> when the
        network learns from its mistakes.
      </p>
      <p>
        Too big and learning becomes unstable, like jerking a bike handle. Too small
        and learning is painfully slow. Finding the right balance is key.
      </p>
      <p>
        The formula is: <code>newWeight = oldWeight − learningRate × error</code>
      </p>
    `,
    codeSnippet: `// Example learning rate
learningRate = 0.01;`,
    fileReference: 'src/utils/neuralNetwork.js',
  },

  'step': {
    title: 'Training Step',
    explanation: `
      <p>
        A training step is <strong>one full practice round</strong> using all your examples.
        After each step, the model gets slightly better at its task.
      </p>
      <p>
        Think of it as one full rehearsal before a performance. The more steps you run,
        the more refined your model becomes (up to a point).
      </p>
    `,
    codeSnippet: `for (let step = 0; step < steps; step++) {
  trainOnAllData();
}`,
    fileReference: 'src/utils/neuralNetwork.js',
  },

  'prediction': {
    title: 'Prediction (Inference)',
    explanation: `
      <p>
        Prediction is using the trained model to <strong>get answers for new data</strong>.
        No learning happens here—just calculation, like taking the final exam after studying.
      </p>
      <p>
        You feed in new input, and the network runs through all its learned weights
        and biases to produce an output.
      </p>
    `,
    fileReference: 'src/utils/neuralNetwork.js',
  },

  'training-progress': {
    title: 'Training Progress',
    explanation: `
      <div style="text-align: center; margin: 20px 0;">
        <img 
          src="https://imgs.xkcd.com/comics/machine_learning.png" 
          alt="Machine Learning - XKCD"
          style="max-width: 100%; max-height: 70vh; display: block; margin: 0 auto;"
        />
      </div>
    `,
    fileReference: 'TrainingProgressNode.jsx',
  },

  'method': {
    title: 'Training Method',
    explanation: `
      <p>
        Training method is <strong>how the network calculates what to fix</strong>.
      </p>
      <p>
        <strong>Backpropagation</strong> is fast and accurate—like using GPS navigation
        to find the best route. It's what everyone uses in practice.
      </p>
      <p>
        <strong>Finite Difference</strong> is slower but simpler to understand. It's like
        trying every possible turn to see which one works best.
      </p>
    `,
    codeSnippet: `// Backpropagation (default)
method: 'backpropagation'

// Finite Difference
method: 'finite-difference'`,
    fileReference: 'src/utils/neuralNetwork.js',
  },
};
