import { removeBackground } from "@imgly/background-removal-node";
import fs from "fs";
import path from "path";

// Configuración personalizable
const config = {
  inputDir: "./input-images",      // Directorio de imágenes de entrada
  outputDir: "./output-images",    // Directorio para guardar las imágenes procesadas
  supportedFormats: [".png", ".jpg", ".jpeg", ".webp"], // Formatos de imagen soportados
  preserveFilenames: true,         // Mantener los nombres de archivo originales
  logProgress: true,               // Mostrar progreso en la consola
};

// Asegurar que los directorios existan
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Directorio creado: ${directory}`);
  }
}

// Convertir Blob a Buffer
async function blobToBuffer(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Obtener todas las imágenes del directorio de entrada
function getImageFiles() {
  ensureDirectoryExists(config.inputDir);
  ensureDirectoryExists(config.outputDir);
  
  const files = fs.readdirSync(config.inputDir);
  
  return files.filter(file => {
    const extension = path.extname(file).toLowerCase();
    return config.supportedFormats.includes(extension);
  });
}

// Procesar una imagen individual
async function processImage(inputFilename) {
  const inputPath = path.join(config.inputDir, inputFilename);
  const outputFilename = config.preserveFilenames 
    ? inputFilename 
    : `${path.parse(inputFilename).name}-nobg${path.extname(inputFilename)}`;
  const outputPath = path.join(config.outputDir, outputFilename);
  
  const absolutePath = path.resolve(inputPath);
  const imageUrl = `file://${absolutePath}`;
  
  try {
    const blob = await removeBackground(imageUrl);
    const buffer = await blobToBuffer(blob);
    fs.writeFileSync(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`Error al procesar ${inputFilename}:`, error.message);
    return false;
  }
}

// Función principal para procesar todas las imágenes
async function main() {
  console.log("Iniciando procesamiento por lotes de eliminación de fondos...");
  
  const imageFiles = getImageFiles();
  
  if (imageFiles.length === 0) {
    console.log(`No se encontraron imágenes en ${config.inputDir}`);
    return;
  }
  
  console.log(`Encontradas ${imageFiles.length} imágenes para procesar`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < imageFiles.length; i++) {
    const filename = imageFiles[i];
    
    if (config.logProgress) {
      console.log(`Procesando imagen ${i + 1}/${imageFiles.length}: ${filename}`);
    }
    
    const success = await processImage(filename);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log("\nProcesamiento completado:");
  console.log(`✅ ${successCount} imágenes procesadas correctamente`);
  if (failCount > 0) {
    console.log(`❌ ${failCount} imágenes fallaron`);
  }
  console.log(`Imágenes guardadas en: ${path.resolve(config.outputDir)}`);
}

// Ejecutar el script
main().catch(error => {
  console.error("Error en el procesamiento por lotes:", error);
});