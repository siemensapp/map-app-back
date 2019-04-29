const fs = require('fs');
const path = require('path');
const variables = require('./variables');

/* ------------------------- FUNCIONES AUXILIARES --------------------------------  */

// Funcion que guarda imagen en disco duro
function saveImage (imagePath, base64Image){
    return new Promise(resolve => {
        fs.writeFile(path.normalize(imagePath), base64Image, { encoding: 'base64'}, (err) => {
            // Revisa si la imagen fue 
            if(err) console.log("Error antes de verificacion", err);
            fs.access(path.normalize(imagePath), fs.constants.F_OK, (error) => {
                let result = (error) ? "false" : "true";
                resolve(result);
            })
        })
    })
}

// Funcion que transforma una imagen existente en una cadena de base64
function convertBase64 (singleWorker) {
    let pathFoto = (singleWorker.Foto) ? singleWorker.Foto : String(variables.serverDirectoryWin + "images\\\\default-user.png")
    let bitmap = fs.readFileSync(path.normalize(pathFoto));
    return new Buffer(bitmap).toString('base64');
}

// Funcion que carga un String en base64 en un Buffer, devuelve Buffer
function loadImagefromBase64 ( base64Image ) {
    console.log("loadImage: ", base64Image);
    return (base64Image !== "") ? new Buffer(base64Image, 'base64'): "";
}

module.exports = {
    saveImage: saveImage,
    convertBase64: convertBase64,
    loadImagefromBase64: loadImagefromBase64
}