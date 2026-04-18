/**
 * Compute 2D positions for neurons given a layer-size array.
 *
 * Layers are laid out left-to-right; neurons within a layer are centered
 * vertically. Units are pixels. The result maps (layerIndex, neuronIndex)
 * → {x, y} — easy to shove into React Flow node positions.
 */

export type LayoutOptions = {
  /** Horizontal distance between consecutive layers. */
  layerSpacing?: number;
  /** Vertical distance between neurons in the same layer. */
  neuronSpacing?: number;
  /** Top padding. */
  paddingTop?: number;
  /** Left padding. */
  paddingLeft?: number;
};

export type NeuronPosition = { layer: number; index: number; x: number; y: number };

export function computeLayout(
  layers: number[],
  options: LayoutOptions = {},
): NeuronPosition[] {
  const {
    layerSpacing = 180,
    neuronSpacing = 70,
    paddingTop = 30,
    paddingLeft = 30,
  } = options;

  // Tallest layer determines the vertical center line.
  const maxLayer = Math.max(...layers);
  const centerY = paddingTop + ((maxLayer - 1) * neuronSpacing) / 2;

  const out: NeuronPosition[] = [];
  layers.forEach((count, layer) => {
    const x = paddingLeft + layer * layerSpacing;
    const top = centerY - ((count - 1) * neuronSpacing) / 2;
    for (let index = 0; index < count; index++) {
      out.push({ layer, index, x, y: top + index * neuronSpacing });
    }
  });
  return out;
}

export function neuronId(layer: number, index: number): string {
  return `neuron:${layer}:${index}`;
}

/** layerPair is the index into state.weights (0 = between layer 0 and layer 1). */
export function weightId(layerPair: number, outIdx: number, inIdx: number): string {
  return `weight:${layerPair}:${outIdx}:${inIdx}`;
}
