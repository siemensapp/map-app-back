const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const variables = require('./variables');
const jwt = require('jsonwebtoken');


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

// Configurar mas tarde CORS
router.use(cors());

/* ------------------------- FUNCIONES AUXILIARES --------------------------------  */

function saveImage (imagePath, base64Image){
    return new Promise(resolve => {
        fs.writeFile(path.normalize(imagePath), base64Image, { encoding: 'base64'}, (err) => {
            // Revisa si la imagen fue 
            if(err) console.log("Error antes de verificacion", err);
            fs.access(path.normalize(imagePath), fs.constants.F_OK, (error) => {
                let result = (error) ? "false" : "true";
                console.log("Result File Exists?", result);
                resolve(result);
            })
        })
    })
}

// Funcion que transforma una imagen existente en una cadena de base64
function convertBase64 (singleWorker) {
    console.log("Convert base 64:", singleWorker.Foto);
    let pathFoto = (singleWorker.Foto) ? singleWorker.Foto : String(variables.serverDirectoryWin + "images\\\\default-user.png")
    let bitmap = fs.readFileSync(path.normalize(pathFoto));
    return new Buffer(bitmap).toString('base64');
}

/* -------------------------------- ENDPOINTS -------------------------------------  */

// router.post()

// Registrar un nuevo usuario, SOLO PARA PRUEBAS Y USO DE BCRYPT
router.post('/register', (req, res, err) => {
    let name = req.body.name;
    let email = req.body.email;
    let hashedPassword = bcrypt.hashSync(req.body.password, 8);
    let query = "INSERT INTO UsuarioDesktop (name, email, password) values('" + name + "','" + email + "','" + hashedPassword + "');";
    console.log(query);
    con.query(query, (error, result) => {
        if (error) return res.json("Error en la base de datos");
        else{
            console.log("Resultados insersion", result);
            res.json("Registro completado");
        }
    })
})

// El usuario se logea a traves de este endpoint
router.post('/login', (req, res, err) => {
    let query = "SELECT * FROM UsuarioDesktop WHERE email='" + req.body.email +"';";
    con.query(query, (error, result) => {
        if(error) return res.json("Usuario no registrado");
        let comparePassword = bcrypt.compareSync(req.body.password, result[0].password);
        if(!comparePassword) return res.json("Contraseña icorrecta");
        let token = jwt.sign({email: result.password}, variables.secret, {expiresIn: 86400})
        return res.send({auth: true, token: token, expiresIn: 86400});
    })
})



// Trae datos de trabajadores en servicio para poner los puntos en el mapa
router.get("/workers", (req, res, err) => {
    console.log("Connected to get")
    var workersQuery, query = "select Especialista.NombreE, Asignacion.CoordenadasEspecialista from asignacion inner join especialista on Especialista.idespecialista = asignacion.idespecialista where idstatus=1 and curdate() between fechainicio and fechafin";
    con.query(query, (error, result, fields) => {
            if (error) throw error;
            workersQuery = result;
            res.json(workersQuery);
        }),
        console.log("Done with get")
});

// Trae datos para llenar opciones del componente de asignacion
router.get("/allWorkers", (req, res, err) => {
    console.log("Connected to get")
    var workersQuery;
    con.query("select NombreE, IdEspecialista from Especialista", (error, result, fields) => {
            if (error) throw error;
            workersQuery = result;
            console.log(workersQuery);
            res.json(workersQuery);
        }),
        console.log("Done with get")
});

// Trae los detalles de los trabajadores a la lista de usuarios, se prepara para la edicion.
router.get("/workersList", (req, res, err) => {
    console.log("Connected to get all List")
    var workersQuery;
    con.query("SELECT Especialista.NombreE, Especialista.Celular, Especialista.FechaNacimiento, Especialista.CeCo, Especialista.Foto, Especialista.IdEspecialista, Especialista.GID, Especialista.CedulaCiudadania, Especialista.LugarExpedicion, Especialista.TarjetaIngresoArgos, Especialista.IdTecnica, Tecnica.NombreT,  Asignacion.IdAsignacion, Status.NombreS from Especialista inner join Tecnica on Especialista.IdTecnica=Tecnica.IdTecnica inner join Asignacion on Especialista.IdEspecialista = Asignacion.IdEspecialista inner join status on Asignacion.IdStatus=Status.IdStatus WHERE CURDATE() BETWEEN Asignacion.FechaInicio AND Asignacion.FechaFin", (error, result, fields) => {
            if (error) throw error;
            workersQuery = result;
            for (let worker of workersQuery) {
                worker["FotoBase64"] = convertBase64(worker);
            }
            res.json(workersQuery);
        }),
        console.log("Done with get all List")
});

// Crea asignacion 
router.post("/setAssignment", (req, res, err) => {
    let data = req.body;

    let IdEspecialista = data.IdEspecialista;
    let IdStatus = data.IdStatus;
    let FechaInicio = data.FechaInicio;
    let FechaFin = data.FechaFin;
    let NombreContacto = data.NombreContacto;
    let TelefonoContacto = data.TelefonoContacto;
    let Descripcion = data.Descripcion;
    let CoordenadasSitio = data.CoordenadasSitio;
    let NombreSitio = data.NombreSitio;
    con.query("INSERT INTO Asignacion (IdEspecialista, IdStatus, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, Descripcion) VALUES(" + IdEspecialista + ", " + IdStatus + ", '" + FechaInicio + "', '" + FechaFin + "', '" + CoordenadasSitio + "', '', '" + NombreSitio + "', '" + NombreContacto + "', '" + TelefonoContacto + "', '" + Descripcion + "')", (error, result, fields) => {
        res.json((error)? "false": "true");
    })
});



// Borra usuario dado un id y tambien sus asignaciones
router.get("/deleteWorker/:workerId", (req, res, err) => {
    console.log("Entered delete");
    console.log(req.params.workerId);
    con.query("delete from Especialista Where IdEspecialista=" + req.params.workerId + ";", (error, result, fields) => {
        res.json( (error)? "false": "true" )
    })
});

// Crea nuevos trabajadores
router.post("/createWorker", (req, res, err) => {
    let data = req.body;

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
    let base64String ,base64Image, imagePath;
    var query = "INSERT INTO Especialista(IdEspecialista, CeCo, NombreE, TarjetaIngresoArgos, Celular, GID, CedulaCiudadania, LugarExpedicion, FechaNacimiento, IdTecnica) VALUES(" + IdEspecialista + ",'" + CeCo + "','" + NombreE + "','" + TarjetaIngresoArgos + "','" + Celular + "','" + GID + "','" + CedulaCiudadania + "','" + LugarExpedicion + "','" + FechaNacimiento + "'," + IdTecnica + "')";
    if (data.Foto) {
        base64String = data.Foto;
        base64Image = base64String.split(';base64,').pop();
        imagePath = variables.serverDirectoryWin + 'images\\\\Foto_' + data.IdEspecialista + ".jpg";
        query = "INSERT INTO Especialista(IdEspecialista, CeCo, NombreE, TarjetaIngresoArgos, Celular, GID, CedulaCiudadania, LugarExpedicion, FechaNacimiento, IdTecnica, Foto) VALUES(" + IdEspecialista + ",'" + CeCo + "','" + NombreE + "','" + TarjetaIngresoArgos + "','" + Celular + "','" + GID + "','" + CedulaCiudadania + "','" + LugarExpedicion + "','" + FechaNacimiento + "'," + IdTecnica + ",'" + imagePath + "')";
    }
    console.log(imagePath);
    con.query(query, async (error, result, fields) => {
        if(data.Foto) {
            saveImage(imagePath, base64Image).then((imageResult) => {
                console.log(imageResult)
                res.json(imageResult);
            })
        } else res.json( (error)? "false": "true");
    })
});

// Sirve para editar usuarios ya existentes
router.post("/editWorker", (req, res, err) => {
    let data = req.body;

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
    let base64String ,base64Image, imagePath;
    var query = "UPDATE Especialista SET NombreE='" + NombreE + "',Celular='" + Celular + "',IdTecnica=" + IdTecnica + ",FechaNacimiento='" + FechaNacimiento + "',CeCo='" + CeCo + "',GID='" + GID + "',CedulaCiudadania='" + CedulaCiudadania + "',LugarExpedicion='" + LugarExpedicion + "',TarjetaIngresoArgos='" + TarjetaIngresoArgos + "' WHERE IdEspecialista=" + IdEspecialista;
    if (data.Foto) {
        base64String = data.Foto;
        base64Image = base64String.split(';base64,').pop();
        imagePath = variables.serverDirectoryWin + 'images\\\\Foto_' + data.IdEspecialista + ".jpg";
        query = "UPDATE Especialista SET NombreE='" + NombreE + "',Celular='" + Celular + "',IdTecnica=" + IdTecnica + ",FechaNacimiento='" + FechaNacimiento + "',CeCo='" + CeCo + "',GID='" + GID + "',CedulaCiudadania='" + CedulaCiudadania + "',LugarExpedicion='" + LugarExpedicion + "',TarjetaIngresoArgos='" + TarjetaIngresoArgos + "',Foto='" + imagePath + "' WHERE IdEspecialista=" + IdEspecialista;
    }
    console.log(imagePath);
    con.query(query, async (error, result, fields) => {
        if(data.Foto) {
            saveImage(imagePath, base64Image).then((imageResult) => {
                console.log(imageResult)
                res.json(imageResult);
            })
        } else res.json( (error)? "false": "true");
    })
});


module.exports = {
    router,
    startingMysql
};