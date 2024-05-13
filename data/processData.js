export function processXMLData(xmlData, namespace) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "application/xml");
    return xmlDoc;
  }
  
  export function extractData(dataElements, id, namespace) {
    const element = Array.from(dataElements).find(el => el.querySelector("Id").textContent === id);
    if (!element) {
      console.warn(`${id} Data Element not found`);
      return [];
    }
    const coordinates = element.querySelector("Coordinates");
    const xs = coordinates.getElementsByTagNameNS(namespace, "X");
    const ys = coordinates.getElementsByTagNameNS(namespace, "Y");
    const zs = coordinates.getElementsByTagNameNS(namespace, "Z");
  
    const subsampleFactor = 1000; // Adjust this value to control the subsampling rate
    let data = [];
    for (let i = 0; i < xs.length; i += subsampleFactor) {
      data.push([
        parseFloat(xs[i].textContent),
        parseFloat(ys[i] ? ys[i].textContent : 0),
        parseFloat(zs[i] ? zs[i].textContent : 0)
      ]);
    }
    return data;
  }