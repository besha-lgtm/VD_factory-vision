const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const tf = require('@tensorflow/tfjs');

// Dataset with paths and annotations
const dataset = [
  // 1. Lamp light green
  { path: 'src/assets/Dataset/lamp/light_green/IMG_1040.jpg', op: 0, prod: 0, run: 1 },
  { path: 'src/assets/Dataset/lamp/light_green/IMG_1041.jpg', op: 0, prod: 0, run: 1 },

  // 2. Lamp light red (11 images)
  { path: 'src/assets/Dataset/lamp/light_red/unknown-4qvic2oa-ingestion-848d69cd95-ttl72.jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/lamp/light_red/unknown-4qvic5he-ingestion-848d69cd95-lzk2f.jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/lamp/light_red/unknown-4qvidm7n-ingestion-848d69cd95-lzk2f.jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/lamp/light_red/unknown-4qvidtnr-ingestion-848d69cd95-lzk2f.jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/lamp/light_red/unknown-4qvie1cj-ingestion-848d69cd95-ttl72.jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/lamp/light_red/unknown-4qvigtps-ingestion-848d69cd95-ttl72.jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/lamp/light_red/unknown-4qvin275-ingestion-848d69cd95-ttl72.jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/lamp/light_red/unknown-4qvinb4d-ingestion-848d69cd95-sqbhb.jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/lamp/light_red/unknown-4qvintuu-ingestion-848d69cd95-lzk2f.jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/lamp/light_red/unknown-4qviomnj-ingestion-848d69cd95-sqbhb.jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/lamp/light_red/unknown-4qvir3b9-ingestion-848d69cd95-lzk2f.jpg', op: 0, prod: 0, run: 0 },

  // 3. Machine idle (3 images)
  { path: 'src/assets/Dataset/machine/machine_idle/IMG-20260804-WA0048(1).jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/machine/machine_idle/IMG-20260804-WA0048(2).jpg', op: 0, prod: 0, run: 0 },
  { path: 'src/assets/Dataset/machine/machine_idle/IMG-20260804-WA0048(3).jpg', op: 0, prod: 0, run: 0 },

  // 4. Machine running (4 images)
  { path: 'src/assets/Dataset/machine/machine_running /AISelect_20260804_205044_Gallery.jpg', op: 0, prod: 1, run: 1 },
  { path: 'src/assets/Dataset/machine/machine_running /AISelect_20260804_205109_Gallery.jpg', op: 0, prod: 1, run: 1 },
  { path: 'src/assets/Dataset/machine/machine_running /AISelect_20260804_205119_Gallery.jpg', op: 0, prod: 1, run: 1 },
  { path: 'src/assets/Dataset/machine/machine_running /AISelect_20260804_205127_Gallery.jpg', op: 0, prod: 1, run: 1 },

  // 5. Operator present (6 images)
  { path: 'src/assets/Dataset/operator/operator_present/Gemini_Generated_Image_1tswx81tswx81tsw.png', op: 1, prod: 1, run: 1 },
  { path: 'src/assets/Dataset/operator/operator_present/Gemini_Generated_Image_630pww630pww630p.png', op: 1, prod: 1, run: 1 },
  { path: 'src/assets/Dataset/operator/operator_present/Gemini_Generated_Image_j2l4nij2l4nij2l4.png', op: 1, prod: 1, run: 1 },
  { path: 'src/assets/Dataset/operator/operator_present/Gemini_Generated_Image_7vnicx7vnicx7vni.png', op: 1, prod: 1, run: 0 },
  { path: 'src/assets/Dataset/operator/operator_present/Gemini_Generated_Image_eomd29eomd29eomd.png', op: 1, prod: 1, run: 0 },
  { path: 'src/assets/Dataset/operator/operator_present/Gemini_Generated_Image_j5p1gjj5p1gjj5p1.png', op: 1, prod: 1, run: 0 },

  // 6. Product rendering
  { path: 'src/assets/kivo_box_rendering.png', op: 0, prod: 1, run: 0 }
];

function loadBmp(filePath) {
  const buf = fs.readFileSync(filePath);
  const pixelOffset = buf.readUInt32LE(10);
  const width = buf.readInt32LE(18);
  const height = buf.readInt32LE(22);
  const bpp = buf.readUInt16LE(28);

  const isBottomUp = height > 0;
  const absHeight = Math.abs(height);
  const rowStride = Math.floor((bpp * width + 31) / 32) * 4;

  const data = new Float32Array(width * absHeight * 3);
  let idx = 0;

  for (let r = 0; r < absHeight; r++) {
    const y = isBottomUp ? (absHeight - 1 - r) : r;
    const rowStart = pixelOffset + y * rowStride;
    for (let c = 0; c < width; c++) {
      const colStart = rowStart + c * (bpp / 8);
      const b = buf[colStart];
      const g = buf[colStart + 1];
      const r_val = buf[colStart + 2];
      data[idx++] = r_val / 255.0;
      data[idx++] = g / 255.0;
      data[idx++] = b / 255.0;
    }
  }

  return tf.tensor4d(data, [1, absHeight, width, 3]);
}

function createLocalIOHandler(modelJsonPath, weightsPath) {
  const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf-8'));
  const weightBuffer = fs.readFileSync(weightsPath).buffer;
  return {
    load: async () => ({
      modelTopology: modelJson.modelTopology,
      weightSpecs: modelJson.weightsManifest[0].weights,
      weightData: weightBuffer
    })
  };
}

async function trainModularModel(backbone, xFeatures, yLabels, targetDir, modelMetadata) {
  fs.mkdirSync(targetDir, { recursive: true });

  const xTrain = tf.tensor2d(xFeatures);
  const yTrain = tf.tensor2d(yLabels, [yLabels.length, 1]);

  // Create head
  const headInput = tf.input({ shape: [1280] });
  let x = tf.layers.dense({ units: 64, activation: 'relu', kernelInitializer: 'heNormal' }).apply(headInput);
  x = tf.layers.dropout({ rate: 0.2 }).apply(x);
  const output = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(x);
  const headModel = tf.model({ inputs: headInput, outputs: output });

  headModel.compile({
    optimizer: tf.train.adam(0.005),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  await headModel.fit(xTrain, yTrain, {
    epochs: 40,
    batchSize: 8,
    shuffle: true,
    verbose: 0
  });

  // Combine backbone with head to create standalone end-to-end model
  const fullInput = tf.input({ shape: [224, 224, 3] });
  const fullFeats = backbone.apply(fullInput);
  const fullOut = headModel.apply(fullFeats);
  const fullModel = tf.model({ inputs: fullInput, outputs: fullOut });

  // Save using custom handler
  await fullModel.save(tf.io.withSaveHandler(async (artifacts) => {
    fs.writeFileSync(path.join(targetDir, 'model.json'), JSON.stringify({
      modelTopology: artifacts.modelTopology,
      weightsManifest: [{
        paths: ['./weights.bin'],
        weights: artifacts.weightSpecs
      }],
      format: artifacts.format,
      generatedBy: artifacts.generatedBy,
      convertedBy: artifacts.convertedBy
    }, null, 2));

    fs.writeFileSync(path.join(targetDir, 'weights.bin'), Buffer.from(artifacts.weightData));
    fs.writeFileSync(path.join(targetDir, 'metadata.json'), JSON.stringify(modelMetadata, null, 2));

    return { modelArtifactsInfo: { dateSaved: new Date() } };
  }));

  console.log(`Saved model to ${targetDir}`);

  xTrain.dispose();
  yTrain.dispose();
  return fullModel;
}

async function main() {
  console.log('Loading base MobileNet backbone...');
  const handler = createLocalIOHandler('src/assets/model/model.json', 'src/assets/model/weights.bin');
  const originalModel = await tf.loadLayersModel(handler);
  const backbone = originalModel.layers[0];

  console.log('Extracting feature embeddings...');
  const featuresList = [];
  const labelsOp = [];
  const labelsProd = [];
  const labelsRun = [];

  const tempBmp = '/tmp/mod_sample.bmp';
  const tempFlipBmp = '/tmp/mod_sample_flip.bmp';

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    // Original
    execSync(`sips -z 224 224 -s format bmp "${item.path}" --out ${tempBmp} 2>/dev/null`);
    const tOriginal = loadBmp(tempBmp);
    const featOriginal = backbone.predict(tOriginal);
    featuresList.push(Array.from(await featOriginal.data()));
    labelsOp.push(item.op);
    labelsProd.push(item.prod);
    labelsRun.push(item.run);
    tOriginal.dispose();
    featOriginal.dispose();

    // Augmentation: Horizontal flip
    execSync(`sips --flip horizontal -z 224 224 -s format bmp "${item.path}" --out ${tempFlipBmp} 2>/dev/null`);
    const tFlip = loadBmp(tempFlipBmp);
    const featFlip = backbone.predict(tFlip);
    featuresList.push(Array.from(await featFlip.data()));
    labelsOp.push(item.op);
    labelsProd.push(item.prod);
    labelsRun.push(item.run);
    tFlip.dispose();
    featFlip.dispose();
  }

  console.log(`Features ready: ${featuresList.length} samples.`);

  // Model 1: Operator Detector
  console.log('\n--- Training Model 1: Operator Detector ---');
  const opModel = await trainModularModel(
    backbone,
    featuresList,
    labelsOp,
    'src/assets/models/operator',
    {
      modelName: 'yolo-operator-detector',
      target: 'Operator Presence',
      threshold: 0.5,
      version: '1.0.0',
      description: 'Vision model for detecting human operators at the production station'
    }
  );

  // Model 2: Product Detector
  console.log('\n--- Training Model 2: Product Detector ---');
  const prodModel = await trainModularModel(
    backbone,
    featuresList,
    labelsProd,
    'src/assets/models/product',
    {
      modelName: 'yolo-product-detector',
      target: 'Product Presence',
      threshold: 0.5,
      version: '1.0.0',
      description: 'Vision model for detecting products/packages on the conveyor line'
    }
  );

  // Model 3: Machine Running / Green Light Detector
  console.log('\n--- Training Model 3: Machine Running Detector ---');
  const runModel = await trainModularModel(
    backbone,
    featuresList,
    labelsRun,
    'src/assets/models/machine_light',
    {
      modelName: 'yolo-machine-light-detector',
      target: 'Machine Running (Green Light)',
      threshold: 0.5,
      version: '1.0.0',
      description: 'Vision model for detecting green signal light indicating active machine running status'
    }
  );

  // Fallback combined model for backward compatibility
  console.log('\n--- Exporting Combined Fallback Model to src/assets/model/ ---');
  const labelsCombined = [];
  for (let i = 0; i < dataset.length; i++) {
    labelsCombined.push([dataset[i].op, dataset[i].prod, dataset[i].run]);
    labelsCombined.push([dataset[i].op, dataset[i].prod, dataset[i].run]);
  }
  const xTrainAll = tf.tensor2d(featuresList);
  const yTrainAll = tf.tensor2d(labelsCombined);
  const headInput = tf.input({ shape: [1280] });
  let x = tf.layers.dense({ units: 64, activation: 'relu', kernelInitializer: 'heNormal', name: 'comb_dense_1' }).apply(headInput);
  x = tf.layers.dropout({ rate: 0.2, name: 'comb_dropout' }).apply(x);
  const output = tf.layers.dense({ units: 3, activation: 'sigmoid', name: 'comb_dense_out' }).apply(x);
  const combinedHead = tf.model({ inputs: headInput, outputs: output, name: 'combined_head' });
  combinedHead.compile({ optimizer: tf.train.adam(0.005), loss: 'binaryCrossentropy' });
  await combinedHead.fit(xTrainAll, yTrainAll, { epochs: 40, batchSize: 8, shuffle: true, verbose: 0 });

  const combInput = tf.input({ shape: [224, 224, 3] });
  const combFeats = backbone.apply(combInput);
  const combOut = combinedHead.apply(combFeats);
  const combModel = tf.model({ inputs: combInput, outputs: combOut });

  await combModel.save(tf.io.withSaveHandler(async (artifacts) => {
    fs.writeFileSync('src/assets/model/model.json', JSON.stringify({
      modelTopology: artifacts.modelTopology,
      weightsManifest: [{ paths: ['./weights.bin'], weights: artifacts.weightSpecs }],
      format: artifacts.format,
      generatedBy: artifacts.generatedBy,
      convertedBy: artifacts.convertedBy
    }, null, 2));
    fs.writeFileSync('src/assets/model/weights.bin', Buffer.from(artifacts.weightData));
    fs.writeFileSync('src/assets/model/metadata.json', JSON.stringify({
      modelName: 'visipak-dynamic-3output-vision-model',
      labels: ['Operator Present', 'Product Present', 'Machine Running (Green Light)'],
      imageSize: 224,
      threshold: 0.5,
      version: '1.0.0'
    }, null, 2));
    return { modelArtifactsInfo: { dateSaved: new Date() } };
  }));
  console.log('✓ Successfully exported combined model to src/assets/model/');
  xTrainAll.dispose();
  yTrainAll.dispose();

  console.log('\n--- Evaluating All 3 Separate Models on Dataset ---');
  let passAll = 0;
  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    execSync(`sips -z 224 224 -s format bmp "${item.path}" --out ${tempBmp} 2>/dev/null`);
    const t = loadBmp(tempBmp);

    const opPred = Array.from(await (opModel.predict(t)).data())[0];
    const prodPred = Array.from(await (prodModel.predict(t)).data())[0];
    const runPred = Array.from(await (runModel.predict(t)).data())[0];

    const opMatch = (opPred >= 0.5 ? 1 : 0) === item.op;
    const prodMatch = (prodPred >= 0.5 ? 1 : 0) === item.prod;
    const runMatch = (runPred >= 0.5 ? 1 : 0) === item.run;

    const allMatch = opMatch && prodMatch && runMatch;
    if (allMatch) passAll++;

    console.log(`${item.path.split('/').pop()}:`);
    console.log(`  Operator: ${opPred.toFixed(2)} (exp ${item.op}) ${opMatch ? '✓' : '✗'}`);
    console.log(`  Product:  ${prodPred.toFixed(2)} (exp ${item.prod}) ${prodMatch ? '✓' : '✗'}`);
    console.log(`  Machine:  ${runPred.toFixed(2)} (exp ${item.run}) ${runMatch ? '✓' : '✗'}`);
    console.log(`  Result: ${allMatch ? 'PASS' : 'FAIL'}`);

    t.dispose();
  }

  console.log(`\nFinal Score: ${passAll} / ${dataset.length} passed all 3 models (${((passAll / dataset.length) * 100).toFixed(1)}%)`);
}

main().catch(console.error);
