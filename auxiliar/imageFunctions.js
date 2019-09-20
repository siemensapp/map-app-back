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
// Funcion que guarda el certificado A en disco duro
function saveCertificadoA (certificadoPath, base64Certificado){
    return new Promise(resolve => {
        fs.writeFile(path.normalize(certificadoPath), base64Certificado, { encoding: 'base64'}, (err) => {
            // Revisa si la imagen fue 
            if(err) console.log("Error antes de verificacion", err);
            fs.access(path.normalize(certificadoPath), fs.constants.F_OK, (error) => {
                let result = (error) ? "false" : "true";
                resolve(result);
            })
        })
    })
}

// Funcion que guarda el certificado MD en disco duro
function saveCertificadoMD (certificadoPathMD, base64CertificadoMD){
    return new Promise(resolve => {
        fs.writeFile(path.normalize(certificadoPathMD), base64CertificadoMD, { encoding: 'base64'}, (err) => {
            // Revisa si la imagen fue 
            if(err) console.log("Error antes de verificacion", err);
            fs.access(path.normalize(certificadoPathMD), fs.constants.F_OK, (error) => {
                let result = (error) ? "false" : "true";
                resolve(result);
            })
        })
    })
}

// Funcion que guarda Vacunas en disco duro
function saveVacunas (VacunasPath, base64V){
    return new Promise(resolve => {
        fs.writeFile(path.normalize(VacunasPath), base64V, { encoding: 'base64'}, (err) => {
            // Revisa si la imagen fue 
            if(err) console.log("Error antes de verificacion", err);
            fs.access(path.normalize(VacunasPath), fs.constants.F_OK, (error) => {
                let result = (error) ? "false" : "true";
                resolve(result);
            })
        })
    })
}

// Funcion que guarda Tprofesional en disco duro
function saveTprofesional (TprofesionalPath, base64T){
    return new Promise(resolve => {
        fs.writeFile(path.normalize(TprofesionalPath), base64T, { encoding: 'base64'}, (err) => {
            // Revisa si la imagen fue 
            if(err) console.log("Error antes de verificacion", err);
            fs.access(path.normalize(TprofesionalPath), fs.constants.F_OK, (error) => {
                let result = (error) ? "false" : "true";
                resolve(result);
            })
        })
    })
}
// Funcion que guarda Conte en disco duro
function saveConte (ContePath, base64C){
    return new Promise(resolve => {
        fs.writeFile(path.normalize(ContePath), base64C, { encoding: 'base64'}, (err) => {
            // Revisa si la imagen fue 
            if(err) console.log("Error antes de verificacion", err);
            fs.access(path.normalize(ContePath), fs.constants.F_OK, (error) => {
                let result = (error) ? "false" : "true";
                resolve(result);
            })
        })
    })
}

// Funcion que transforma una imagen existente en una cadena de base64
function convertBase64 (singleWorker) {
    let pathFoto = (singleWorker.Foto) ? singleWorker.Foto : String(variables.serverDirectoryWin + "images\default-user.png")
    let bitmap = fs.readFileSync(path.normalize(pathFoto));
    return new Buffer(bitmap).toString('base64');
}

// Funcion que transforma un documento A existente en una cadena de base64
function convertCABase64 (singleWorker) {
    let pathCertificadoA = (singleWorker.Foto) ? singleWorker.Foto : String(variables.serverDirectoryWin + "images\default-user.png")
    let bitmap = fs.readFileSync(path.normalize(pathCertificadoA));
    return new Buffer(bitmap).toString('base64');
}

// Funcion que transforma un documento MD existente en una cadena de base64
function convertCAMDBase64 (singleWorker) {
    let pathCertificadoMD = (singleWorker.Foto) ? singleWorker.Foto : String(variables.serverDirectoryWin + "images\default-user.png")
    let bitmap = fs.readFileSync(path.normalize(pathCertificadoMD));
    return new Buffer(bitmap).toString('base64');
}

// Funcion que transforma un documento Tprofesioanal existente en una cadena de base64
function convertTprofesionalBase64 (singleWorker) {
    let pathTprofesional = (singleWorker.Foto) ? singleWorker.Foto : String(variables.serverDirectoryWin + "images\default-user.png")
    let bitmap = fs.readFileSync(path.normalize(pathTprofesional));
    return new Buffer(bitmap).toString('base64');
}

// Funcion que transforma un documento Vacunas existente en una cadena de base64
function convertVacunasBase64 (singleWorker) {
    let pathVacunas = (singleWorker.Foto) ? singleWorker.Foto : String(variables.serverDirectoryWin + "images\default-user.png")
    let bitmap = fs.readFileSync(path.normalize(pathVacunas));
    return new Buffer(bitmap).toString('base64');
}
// Funcion que transforma un documento Conte existente en una cadena de base64
function convertConteBase64 (singleWorker) {
    let pathConte = (singleWorker.Foto) ? singleWorker.Foto : String(variables.serverDirectoryWin + "images\default-user.png")
    let bitmap = fs.readFileSync(path.normalize(pathConte));
    return new Buffer(bitmap).toString('base64');
}
// Funcion que carga un String en base64 en un Buffer, devuelve Buffer
function loadImagefromBase64 ( base64Image ) {
    console.log("loadImage: ", base64Image);
    return (base64Image !== "") ? new Buffer(base64Image, 'base64'): "";
}

// Funcion que carga un String en base64 en un Buffer, devuelve Buffer
function loadCertificadoAfromBase64 ( base64Certificado) {
    console.log("loadCertificado: ", base64Certificado);
    return (base64Certificado !== "") ? new Buffer(base64Certificado, 'base64'): "";
}

// Funcion que carga un String en base64 en un Buffer, devuelve Buffer
function loadCertificadoMDfromBase64 ( base64CertificadoMD) {
    console.log("loadCertificado: ", base64CertificadoMD);
    return (base64CertificadoMD !== "") ? new Buffer(base64CertificadoMD, 'base64'): "";
}

// Funcion que carga un String en base64 en un Buffer, devuelve Buffer
function loadVacunasfromBase64 ( base64V) {
    console.log("loadCertificado: ", base64V);
    return (base64V !== "") ? new Buffer(base64V, 'base64'): "";
}

// Funcion que carga un String en base64 en un Buffer, devuelve Buffer
function loadTprofesionalfromBase64 ( base64T) {
    console.log("loadCertificado: ", base64T);
    return (base64T !== "") ? new Buffer(base64T, 'base64'): "";
}

// Funcion que carga un String en base64 en un Buffer, devuelve Buffer
function loadContefromBase64 ( base64C) {
    console.log("loadCertificado: ", base64C);
    return (base64C !== "") ? new Buffer(base64C, 'base64'): "";
}
module.exports = {
    saveImage: saveImage,
    saveCertificadoA:saveCertificadoA,
    saveCertificadoMD: saveCertificadoMD,
    saveVacunas: saveVacunas,
    saveTprofesional:saveTprofesional,
    saveConte: saveConte,
    convertBase64: convertBase64,
    convertCABase64: convertCABase64,
    convertCAMDBase64: convertCAMDBase64,
    convertVacunasBase64: convertVacunasBase64,
    convertTprofesionalBase64:convertTprofesionalBase64,
    convertConteBase64: convertConteBase64,
    loadImagefromBase64: loadImagefromBase64,
    loadCertificadoAfromBase64,loadCertificadoAfromBase64,
    loadCertificadoMDfromBase64:loadCertificadoMDfromBase64,
    loadVacunasfromBase64:loadVacunasfromBase64,
    loadTprofesionalfromBase64:loadTprofesionalfromBase64,
    loadContefromBase64:loadContefromBase64
}