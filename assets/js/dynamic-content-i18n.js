(function () {
  "use strict";
  if (!(document.documentElement.lang || "").toLowerCase().startsWith("en")) return;

  const pairs = [
    ["Procesando...","Processing..."],["[Forma de onda aparecerá aquí]","[The waveform will appear here]"],
    ["Iniciando reconstrucción...","Starting reconstruction..."],["Error: Espectro truncado inválido.","Error: invalid truncated spectrum."],
    ["No se pudo iniciar el audio. Intenta interactuar con la página y reintentar.","The audio could not start. Interact with the page and try again."],
    ["Error crítico: AudioContext no disponible.","Critical error: AudioContext is unavailable."],["Audio listo para análisis DFT.","Audio ready for DFT analysis."],
    ["Selecciona un audio precalculado","Select precomputed audio"],["Selecciona una reconstrucción","Select a reconstruction"],
    ["Reconstrucción precalculada cargada correctamente.","Precomputed reconstruction loaded successfully."],
    ["Carga o graba audio primero.","Load or record audio first."],["Calcula la DFT primero.","Calculate the DFT first."],
    ["Error: Reconstrucción sin DFT.","Error: reconstruction without a DFT."],["Grabación finalizada. Procesando...","Recording complete. Processing..."],
    ["Grabación iniciada...","Recording started..."],["Deteniendo grabación...","Stopping recording..."],
    ["Cargar Filtro Precalculado","Load precomputed filter"],["Aplicar Filtro y Calcular IDFT","Apply filter and calculate IDFT"],
    ["No hay datos para mostrar.","No data to display."],["Valores de la Matriz (Primeros 10x10)","Matrix values (first 10×10)"],
    ["Coeficientes DFT (Magnitud, Primeros 10x10, No Centrado)","DFT coefficients (magnitude, first 10×10, uncentred)"],
    ["Valores de la Matriz Filtrada (Primeros 10x10)","Filtered matrix values (first 10×10)"],
    ["Selecciona una imagen","Select an image"],["Selecciona un corte","Select a cutoff"],
    ["Biblioteca de imágenes precalculadas disponible.","Precomputed image library available."],
    ["Filtro aplicado con éxito.","Filter applied successfully."],["Aplicación inicializada. Puedes subir una imagen o usar la biblioteca precalculada.","Application initialised. Upload an image or use the precomputed library."],
    ["Por favor, selecciona un archivo de imagen válido.","Select a valid image file."],["Error procesando la imagen.","Error processing the image."],
    ["Ocurrió un error calculando la DFT.","An error occurred while calculating the DFT."],["No se pudo cargar la imagen.","The image could not be loaded."],
    ["No se pudo leer el archivo.","The file could not be read."],["Selecciona primero una imagen y un corte precalculado.","First select an image and a precomputed cutoff."],
    ["No se pudo cargar el filtro precalculado.","The precomputed filter could not be loaded."],["Carga una imagen primero.","Load an image first."],
    ["Ocurrió un error durante el filtrado.","An error occurred during filtering."],["No se pudo cargar la imagen precalculada.","The precomputed image could not be loaded."]
  ];
  const dictionary = new Map(pairs);
  const patterns = [
    [/^Primeros (\d+) de (\d+) valores \((.+)\):/,"First $1 of $2 values ($3):"],
    [/^Primeros (\d+) de (\d+) (.+):/,"First $1 of $2 $3:"],
    [/^(.+) \(Primeros (\d+)x(\d+)\)$/, "$1 (first $2×$3)"],
    [/^(.+) \(Primeros (\d+)x(\d+), No Centrado\)$/, "$1 (first $2×$3, uncentred)"],
    [/^Reproducción (.+) finalizada\.$/,"$1 playback finished."],
    [/^Audio (.+) no disponible\.$/,"$1 audio is unavailable."],
    [/^Cargando reconstrucción precalculada \((.+) coeficientes\)\.\.\.$/,"Loading precomputed reconstruction ($1 coefficients)..."]
  ];
  function translate(value) {
    if (typeof value !== "string") return value;
    const compact = value.replace(/\s+/g," ").trim();
    if (dictionary.has(compact)) return dictionary.get(compact);
    for (const [pattern,replacement] of patterns) if (pattern.test(compact)) return compact.replace(pattern,replacement);
    return value;
  }
  function translateNode(root) {
    if (!root) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach((node)=>{if(!node.parentElement||["SCRIPT","STYLE"].includes(node.parentElement.tagName))return;const value=translate(node.nodeValue);if(value!==node.nodeValue)node.nodeValue=value;});
  }
  const nativeAlert=window.alert.bind(window);
  window.alert=(message)=>nativeAlert(translate(String(message)));
  const start=()=>{translateNode(document.body);new MutationObserver((mutations)=>mutations.forEach((mutation)=>{if(mutation.type==="characterData"){const value=translate(mutation.target.nodeValue);if(value!==mutation.target.nodeValue)mutation.target.nodeValue=value;}else mutation.addedNodes.forEach((node)=>{if(node.nodeType===Node.TEXT_NODE){const value=translate(node.nodeValue);if(value!==node.nodeValue)node.nodeValue=value;}else if(node.nodeType===Node.ELEMENT_NODE)translateNode(node);});})).observe(document.body,{childList:true,subtree:true,characterData:true});};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
