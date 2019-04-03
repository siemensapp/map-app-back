const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const variables = require('./variables');


const router = express.Router();

var con;

const startingMysql = () => {
    con = mysql.createConnection({
        host: 'localhost',
        database: 'fieldservice',
        user: 'root',
        password: 'admin',
        insecureAuth: true
    });

    con.connect((err) => {
        if (err) {
            console.log("Not connected to Mysql, Retrying ...");
            //console.log(err);
            setTimeout(startingMysql, 5000);
        } else {
            console.log("Connected to Mysql!");
        }
    });
}

router.use(cors());

router.get("/workers", (req, res, err) => {
    console.log("Connected to get")
    var workersQuery;
    con.query("select Especialista.NombreE, Asignacion.CoordenadasEspecialista from asignacion inner join especialista on Especialista.idespecialista = asignacion.idespecialista where idstatus=1 and curdate() between fechainicio and fechafin", (error, result, fields) => {
            if (error) throw error;
            workersQuery = result;
            console.log(workersQuery);
            res.json(workersQuery);
        }),
        console.log("Done with get")
});

router.get("/allWorkers", (req, res, err) => {
    console.log("Connected to get")
    var workersQuery;
    con.query("select NombreE, IdEspecialista, Foto from Especialista", (error, result, fields) => {
            if (error) throw error;
            workersQuery = result;
            console.log(workersQuery);
            res.json(workersQuery);
        }),
        console.log("Done with get")
});


router.get("/workersList", (req, res, err) => {
    console.log("Connected to get all List")
    var workersQuery;
    con.query("SELECT Especialista.NombreE, Especialista.Celular, Especialista.FechaNacimiento, Especialista.CeCo, Especialista.Foto, Especialista.IdEspecialista, Especialista.GID, Especialista.CedulaCiudadania, Especialista.LugarExpedicion, Especialista.TarjetaIngresoArgos, Especialista.IdTecnica, Tecnica.NombreT,  Asignacion.IdAsignacion, Status.NombreS from Especialista inner join Tecnica on Especialista.IdTecnica=Tecnica.IdTecnica inner join Asignacion on Especialista.IdEspecialista = Asignacion.IdEspecialista inner join status on Asignacion.IdStatus=Status.IdStatus WHERE CURDATE() BETWEEN Asignacion.FechaInicio AND Asignacion.FechaFin", (error, result, fields) => {
            if (error) throw error;
            workersQuery = result;
            for (let worker of workersQuery) {

                function convertBase64(singleWorker) {
                    if (singleWorker.Foto) {
                        let pathFoto = singleWorker.Foto;
                        let bitmap = fs.readFileSync(path.normalize(pathFoto));
                        return new Buffer(bitmap).toString('base64');
                    }
                    return "";
                }
                worker["FotoBase64"] = convertBase64(worker);
            }
            console.log(workersQuery);
            res.json(workersQuery);
        }),
        console.log("Done with get all List")
});

router.post("/setAssignment", (req, res, err) => {
    console.log(req.body);
    // con.query("INSERT INTO Asignacion (IdEspecialista, IdStatus, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, Descripcion)", (error, result, fields) =>{
    //     if(error) throw error;    
    // })   
    res.json("Done with post");
});

router.get("/deleteWorker/:workerId", (req, res, err) => {
    if (err) throw err;
    console.log("Entered delete");
    console.log(req.params.workerId);
    con.query("delete from Especialista Where IdEspecialista=" + req.params.workerId + ";", (error, result, fields) => {
        if (error) throw error;
        console.log("Borrado ese perro");
        res.json("se pudo");
    })
    res.json("Done with delete");
});

router.post("/createWorker", (req, res, err) => {
    let data = req.body;

    // image path
    let base64String = data.Foto;
    let base64Image = base64String.split(';base64,').pop();

    let IdEspecialista = data.IdEspecialista;
    let NombreE = data.NombreE;
    let Celular = data.Celular;
    let IdTecnica = data.IdTecnica;
    let FechaNacimiento = data.FechaNacimiento;
    let CeCo = data.CeCo;
    let GID = data.GID;
    let CedulaCiudadania = data.CedulaCiudadania;
    let LugarExpedicion = data.LugarExpedicion;
    let TarjetaIngresoArgos = data.TarjetaIngresoArgos;
    let imagePath = variables.serverDirectoryWin + 'images\\\\Foto_' + data.IdEspecialista + ".jpg";
    console.log(imagePath);

    var query = "INSERT INTO Especialista(IdEspecialista, CeCo, NombreE, TarjetaIngresoArgos, Celular, GID, CedulaCiudadania, LugarExpedicion, FechaNacimiento, IdTecnica, Foto) VALUES(" + IdEspecialista + ",'" + CeCo + "','" + NombreE + "','" + TarjetaIngresoArgos + "','" + Celular + "','" + GID + "','" + CedulaCiudadania + "','" + LugarExpedicion + "','" + FechaNacimiento + "'," + IdTecnica + ",'" + imagePath + "')";

    con.query(query, (error, result, fields) => {
        if (error) throw error;
        res.json( saveImage(imagePath, base64Image) ? "Image saved !" : "There was an error with the image" );
    })
});

router.post("/editWorker", (req, res, err) => {
    let data = req.body;

    // image path
    let base64String = data.Foto;
    let base64Image = base64String.split(';base64,').pop();

    let IdEspecialista = data.IdEspecialista;
    let NombreE = data.NombreE;
    let Celular = data.Celular;
    let IdTecnica = data.IdTecnica;
    let FechaNacimiento = data.FechaNacimiento;
    let CeCo = data.CeCo;
    let GID = data.GID;
    let CedulaCiudadania = data.CedulaCiudadania;
    let LugarExpedicion = data.LugarExpedicion;
    let TarjetaIngresoArgos = data.TarjetaIngresoArgos;
    // Image route
    //let imagePath = path.join(variables.serverDirectoryWin, 'images', data.NombreE + ".jpg"); 
    let imagePath = variables.serverDirectoryWin + 'images\\\\Foto_' + data.IdEspecialista + ".jpg";
    console.log(imagePath);

    var query = "UPDATE Especialista SET NombreE='" + NombreE + "',Celular='" + Celular + "',IdTecnica=" + IdTecnica + ",FechaNacimiento='" + FechaNacimiento + "',CeCo='" + CeCo + "',GID='" + GID + "',CedulaCiudadania='" + CedulaCiudadania + "',LugarExpedicion='" + LugarExpedicion + "',TarjetaIngresoArgos='" + TarjetaIngresoArgos + "',Foto='" + imagePath + "' WHERE IdEspecialista=" + IdEspecialista;
    console.log(query);

    con.query(query, (error, result, fields) => {
        if (error) throw error;
        res.json( saveImage(imagePath, base64Image) ? "Image saved !" : "There was an error with the image" );
    })
});


// Saves the new image
const saveImage = (imagePath, base64Image) => {
    fs.writeFile(path.normalize(imagePath), base64Image, { encoding: 'base64' }, (err) => {
        if (err) return false;
        return true;
    })
};

// router.post('/labs/search', async (req, res) => {

//     var count = await Labs.countDocuments({}, (err, count) => { return count})
//     if(count == 0) {
//         console.log('load files to toxlabs')
//         const fs = require('fs')
//         const path = require('path')
//         await Labs.insertMany(JSON.parse(await fs.readFileSync(path.join(__dirname, 'national-toxlabs.json'))))
//         console.log('Done loading results')
//         var c = await Labs.countDocuments({}, (err, count) => {return count})
//         console.log('Number of results: ' + c)
//     }
//     console.log(req.body)

//     const city = req.body.city.split(",")[0]
//     const conversation_id = req.body.id;    
//     const docs = await Labs.find({ciudad: city}).select({nombre: 1, direccion: 1, telefono: 1})
//     const reply = lab_search(docs, city)
//     await res.json({
//          replies: [{
//             type: 'text',
//             content: `Esto fue lo que encontre.`
//         }]
//     })

//     var headers = {
//         'Content-Type' : 'application/json',
//         'Authorization' : 'Token bc6a6c225d77a9e9a27d173f4458b4bb'
//     }

//     var options = {
//         url: `https://api.recast.ai/connect/v1/conversations/${conversation_id}/messages`,
//         method: 'POST',
//         headers: headers,
//         form: {'messages': reply}
//     }

//     request(options, (error, res, body) => {
//         if (!error && res.statusCode == 201){
//             console.log('Made it')
//         }
//     })
// })

// const questionSchema = new mongoose.Schema({
//     type: String,
//     email: String,
//     question: String
// })

// const Questions = mongoose.model('quest', questionSchema)

// router.post('/questions', async (req, res) => {
//     res.end();
//     const question = new Questions({
//         type: req.body.type,
//         email: req.body.email,
//         question: req.body.question
//     })
//     var conversation_id = req.body.id;
//     console.log(req.body)
//     await question.save()
//         .then(() => {
//             console.log('Saved Question in DB!')
//             var headers = {
//                 'Content-Type' : 'application/json',
//                 'Authorization' : 'Token bc6a6c225d77a9e9a27d173f4458b4bb'
//             }

//             var options = {
//                 url: `https://api.recast.ai/connect/v1/conversations/${conversation_id}/messages`,
//                 method: 'POST',
//                 headers: headers,
//                 form: {'messages': [{ type: 'text', content: `Tu pregunta fue guardada exitosamente !`}]}
//             }

//             request(options, (error, res, body) => {
//                 if (!error && res.statusCode == 201){
//                     console.log('Made it')
//                 }
//             })            
//         })
// })
module.exports = {
    router,
    startingMysql
};