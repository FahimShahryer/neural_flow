/**
 * Neural Network engine — data types.
 *
 * The shape is deliberately simple and learner-inspectable: everything is
 * plain arrays of numbers. No Float32Array, no tensors. When a learner clicks
 * weight[1][2][0], they should see *the same number* the engine just used.
 */

export type ActivationKind = "linear" | "relu" | "sigmoid" | "tanh";

export type Sample = {
  /** Input feature vector. Length must equal config.layers[0]. */
  x: number[];
  /** Target value. Scalar for regression; a one-hot vector later if we want classification. */
  y: number;
};

export type NNConfig = {
  /**
   * Layer sizes, including input. E.g. [3, 4, 1] means 3 inputs, one hidden
   * layer of 4 neurons, and 1 output neuron.
   */
  layers: number[];

  /**
   * Activation function applied to each non-input layer.
   * Length must equal layers.length - 1. activations[i] applies to layers[i+1].
   */
  activations: ActivationKind[];

  /** Seed for weight initialization. Change → fresh weights. */
  seed: number;

  /** Training dataset. The engine walks through samples one at a time. */
  dataset: Sample[];
};

export type NNPhaseId =
  | "idle" // nothing has happened yet; waiting for step()
  | "input" // a sample has been loaded and placed on the input layer
  | "forward" // activations have been computed layer-by-layer
  | "predict"; // the output layer's value is the prediction

export type NNEventDetail = {
  sampleIndex?: number;
  input?: number[];
  preActivations?: number[][];
  activations?: number[][];
  prediction?: number;
  actual?: number;
};

export type NNState = {
  config: NNConfig;

  /**
   * Weights for every inter-layer matrix.
   * weights[l][j][i] = weight from neuron i in layer l to neuron j in layer l+1.
   */
  weights: number[][][];

  /**
   * Biases per layer. biases[l][j] is the bias for neuron j in layer l+1.
   * (No bias on the input layer.)
   */
  biases: number[][];

  /** Index of the sample currently being processed (or last processed). */
  sampleIndex: number;

  /** Teaching phase. 'idle' after init/reset; advances with each step. */
  phase: NNPhaseId;

  /**
   * activations[0] is the input vector; activations[l] for l>0 is the
   * post-activation output of layer l. Populated after the 'forward' phase.
   */
  activations: number[][];

  /**
   * Pre-activation z values. preActivations[l] corresponds to activations[l+1].
   * Useful for teaching — learners can see z alongside a = f(z).
   */
  preActivations: number[][];

  /** Prediction from the most recent forward pass, or null. */
  prediction: number | null;
};
