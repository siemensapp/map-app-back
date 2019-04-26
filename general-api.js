const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const variables = require('./auxiliar/variables');
const jwt = require('jsonwebtoken');
const auxImage = require('./auxiliar/imageFunctions');
const verifyToken = require('./auxiliar/verifyToken');


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

/* -------------------------------- ENDPOINTS -------------------------------------  */

// router.post()

// Registrar un nuevo usuario de Desktop, SOLO PARA PRUEBAS Y USO DE BCRYPT
router.post('/registerDesktop', (req, res, err) => {
    let name = req.body.name;
    let email = req.body.email;
    let hashedPassword = bcrypt.hashSync(req.body.password, 8);
    let query = "INSERT INTO UsuarioDesktop (name, email, password) values('" + name + "','" + email + "','" + hashedPassword + "');";
    console.log(query);
    con.query(query, (error, result) => {
        if (error) return res.json("Error en la base de datos");
        else{
            res.json("Registro completado");
        }
    })
})

// Registrar un nuevo usuario de App, SOLO PARA PRUEBAS Y USO DE BCRYPT
router.post('/registerApp', (req, res, err) => {
    let CedulaCiudadania = req.body.cedula;
    let hashedPassword = bcrypt.hashSync(req.body.password, 8);
    let query = "INSERT INTO UsuarioApp (CedulaCiudadania, password) values('" + CedulaCiudadania + "','" + hashedPassword + "');";
    console.log(query);
    con.query(query, (error, result) => {
        if (error) return res.json("Error en la base de datos");
        else{
            res.json("Registro completado");
        }
    })
})

// El usuario se logea a traves de este endpoint
router.post('/login', (req, res, err) => {
    let query = "SELECT * FROM UsuarioApp WHERE CedulaCiudadania='" + req.body.user +"';";
    con.query(query, (err, result) => {
        if (result.length == 0) return res.json("Usuario no encontrado");
        let comparePassword = bcrypt.compareSync(req.body.password, result[0].password);
        if(!comparePassword) return res.json("Contraseña incorrecta");
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

// Endpoint para probar el middleware del token
router.get('/test', verifyToken, (req, res) => {
    res.json("Prueba exitosa");
})

// Trae datos para llenar opciones del componente de asignacion
router.get("/allWorkers", (req, res, err) => {
    console.log("Connected to get")
    var workersQuery;
    con.query("select NombreE, IdEspecialista from Especialista", (error, result, fields) => {
            if (error) throw error;
            workersQuery = result;
            res.json(workersQuery);
        })
});

// Trae los detalles de los trabajadores a la lista de usuarios, se prepara para la edicion.
router.get("/workersList/:date", (req, res, err) => {
    console.log("Connected to get all List")
    var workersQuery;
    let fecha = req.params.date;
    let query = "SELECT Especialista.NombreE, Especialista.Celular, Especialista.FechaNacimiento, Especialista.CeCo, Especialista.Foto, Especialista.IdEspecialista, Especialista.GID, Especialista.CedulaCiudadania, Especialista.LugarExpedicion, Especialista.TarjetaIngresoArgos, Especialista.IdTecnica, Tecnica.NombreT,  Asignacion.IdAsignacion, Status.NombreS from Especialista inner join Tecnica on Especialista.IdTecnica=Tecnica.IdTecnica inner join Asignacion on Especialista.IdEspecialista = Asignacion.IdEspecialista inner join status on Asignacion.IdStatus=Status.IdStatus WHERE '" + fecha + "' BETWEEN Asignacion.FechaInicio AND Asignacion.FechaFin"; 
    con.query(query , (error, result, fields) => {
            if (error) throw error;
            workersQuery = result;
            for (let worker of workersQuery) {
                worker["FotoBase64"] = auxImage.convertBase64(worker);
            }
            return res.json(workersQuery);
        })
});

// Crea asignacion 
router.post("/setAssignment", (req, res, err) => {
    let data = req.body;
    let IdEspecialista = data.IdEspecialista;
    let FechaInicio = data.FechaInicio;
    let FechaFin = data.FechaFin;
    let checkQuery = "SELECT * FROM Asignacion WHERE IdEspecialista = " + IdEspecialista + " AND '" + FechaInicio + "' BETWEEN FechaInicio AND FechaFin OR '" + FechaFin + "' BETWEEN FechaInicio AND FechaFin";
    con.query(checkQuery, (error, result) => {
        if (error) return res.json("false");
        if (result.length !== 0) return res.json("existe");
        let IdEspecialista = data.IdEspecialista;
        let IdStatus = data.IdStatus;
        let FechaInicio = data.FechaInicio;
        let NombreContacto = data.NombreContacto;
        let TelefonoContacto = data.TelefonoContacto;
        let Descripcion = data.Descripcion;
        let CoordenadasSitio = data.CoordenadasSitio;
        let NombreSitio = data.NombreSitio;

        let insertQuery = "INSERT INTO Asignacion (IdEspecialista, IdStatus, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, Descripcion) VALUES(" + IdEspecialista + ", " + IdStatus + ", '" + FechaInicio + "', '" + FechaFin + "', '" + CoordenadasSitio + "', '', '" + NombreSitio + "', '" + NombreContacto + "', '" + TelefonoContacto + "', '" + Descripcion + "')";
        con.query(insertQuery, (error, result) => res.json((error)? "false": "true"));
    })
});



// Borra usuario dado un id y tambien sus asignaciones
router.get("/deleteWorker/:workerId", (req, res, err) => {
    console.log("Entered delete");
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
            auxImage.saveImage(imagePath, base64Image).then((imageResult) => {
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
            auxImage.saveImage(imagePath, base64Image).then((imageResult) => {
                res.json(imageResult);
            })
        } else res.json( (error)? "false": "true");
    })
});


// Trae asignaciones dada una fecha (mes y año)
router.get('/getAssignments/:date', (req, res , err) => {
    let auxDate = req.params.date.split("-");
    let query = "SELECT * FROM asignacion where YEAR(fechaInicio) = " + auxDate[0] + " and YEAR(fechaFin) = " +auxDate[0] + " and MONTH(fechaInicio) = " + auxDate[1] + " or MONTH(fechaFin) = " + auxDate[1] +";";
    con.query(query, (error, result) => {
        if (error) return res.json("HUbo un error");
        console.log("getAssignment length:", result.length);
        res.json(result);
    })
})

// Trae asignaciones de un especialista dada la cedula de ciudadania
router.get('/getWorkerAssignments/:worker', (req, res , err) => {
    let worker = req.params.worker;
    let query = "SELECT * from Asignacion INNER JOIN Especialista ON Especialista.IdEspecialista=Asignacion.IdEspecialista WHERE Especialista.CedulaCiudadania='" + worker + "';";
    // let query = "SELECT * from Asignacion INNER JOIN Especialista ON Especialista.IdEspecialista=Asignacion.IdEspecialista WHERE Especialista.CedulaCiudadania='10236';";
    con.query(query, (error, result) => {
        if (error) return res.json("Hubo un error");
        res.json(result);
    })
})

// Trae info de las asignaciones de un trabajador
router.get('/getInfoAssignment/:id/:date', (req, res , err) => {
    let id = req.params.id;
    let date = req.params.date;
    let query = " SELECT Especialista.NombreE, Tecnica.NombreT, Status.NombreS, Asignacion.IdEspecialista, Asignacion.IdStatus, Asignacion.IdAsignacion, Asignacion.FechaInicio, Asignacion.FechaFin, Asignacion.NombreSitio, Asignacion.NombreContacto, Asignacion.TelefonoContacto, Asignacion.Descripcion, Asignacion.CoordenadasSitio, Asignacion.CoordenadasEspecialista FROM Especialista INNER JOIN Tecnica ON Especialista.IdTecnica=Tecnica.IdTecnica INNER JOIN Asignacion ON Especialista.IdEspecialista=Asignacion.IdEspecialista INNER JOIN Status ON Asignacion.IdStatus=Status.IdStatus WHERE Asignacion.IdEspecialista="+id+" AND '"+date+"' BETWEEN Asignacion.FechaInicio AND Asignacion.FechaFin;";
    // let query = "SELECT * from Asignacion INNER JOIN Especialista ON Especialista.IdEspecialista=Asignacion.IdEspecialista WHERE Especialista.CedulaCiudadania='10236';";
    con.query(query, (error, result) => {
        if (error) return res.json("Hubo un error");
        res.json(result);
    })
})

// Borra asignacion dado el id del especialista y la fecha
router.post("/deleteAssignment/", (req, res, err) => {
    let body = req.body;
    let query = "delete from asignacion Where IdEspecialista=" + body.IdEspecialista + " AND '" + body.fecha + "' BETWEEN FechaInicio and FechaFin;";
    con.query(query, (error, result, fields) => {
        if (error) return res.json("Hubo un error en deleteAsignacion");
        let query2 = "INSERT INTO AsignacionEliminada (IdEspecialista, IdStatus, IdAsignacion, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, Descripcion, SujetoCancelacion, RazonCancelacion) VALUES(" + body.IdEspecialista + ", " + body.IdStatus + ", " + body.IdAsignacion + ", '" + body.FechaInicio + "', '" + body.FechaFin + "', '" + body.CoordenadasSitio + "', '', '" + body.NombreSitio + "', '" + body.NombreContacto + "', '" + body.TelefonoContacto + "', '" + body.Descripcion + "' ,'" + body.SujetoCancelacion + "', '" + body.RazonCancelacion + "');";
        con.query(query2, (error, result, fields) => {
            if (error) return res.json("Hubo un error en insert asignacionEliminada");
            return res.json( (error)? "false":"true" )
        })
    })
});

// Trae las asignaciones del mes
router.get("/getMonthAssignments/:date", (req, res, err) => {
    let date = req.params.date;
    let query = "SELECT Asignacion.IdEspecialista, Asignacion.IdStatus, Asignacion.FechaInicio, Asignacion.FechaFin, Especialista.IdTecnica as tecnica, (SELECT COUNT(*) FROM Especialista WHERE IdTecnica=tecnica) as Cuenta FROM Asignacion INNER JOIN Especialista ON Asignacion.IdEspecialista=Especialista.IdEspecialista WHERE YEAR(Asignacion.FechaInicio) = YEAR('" + date + "') AND MONTH(Asignacion.FechaInicio)=MONTH('" + date + "') OR YEAR(Asignacion.FechaFin) = YEAR('" + date + "') AND MONTH(Asignacion.FechaFin) = MONTH('" + date + "');";
    con.query(query, (error, result) => {
        if (error) return res.json("Error");
        return res.json(result);
    })
})

// Trae TODAS las asignaciones eliminadas
router.get('/getDeletedAssignments/:date/:text', (req, res , err) => {
    let Sdate = req.params.date;
    let Stext = req.params.text;
    console.log(Sdate, Stext);
    if(Sdate == "'null'" && Stext == "'null'"){
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM AsignacionEliminada AS ae INNER JOIN Especialista AS e ON ae.IdEspecialista=e.IdEspecialista ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            console.log("getAssignment length:", result.length);
            res.json(result);
    })
    }
    else if(Sdate == "'null'" && Stext !== "'null'"){
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM AsignacionEliminada AS ae INNER JOIN Especialista AS e ON ae.IdEspecialista=e.IdEspecialista WHERE (ae.IdEspecialista LIKE '%"+Stext+"%' OR ae.NombreSitio LIKE '%"+Stext+"%' OR ae.NombreContacto LIKE '%"+Stext+"%' OR ae.TelefonoContacto LIKE '%"+Stext+"%' OR ae.Descripcion LIKE '%"+Stext+"%' OR ae.SujetoCancelacion LIKE '%"+Stext+"%' OR ae.RazonCancelacion LIKE '%"+Stext+"%' OR e.NombreE LIKE '%"+Stext+"%') ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            console.log("getAssignment length:", result.length);
            res.json(result);
        })
    }
    else if(Sdate !== "'null'" && Stext == "'null'"){
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM AsignacionEliminada AS ae INNER JOIN Especialista AS e ON ae.IdEspecialista=e.IdEspecialista WHERE ('"+Sdate+"' BETWEEN ae.FechaInicio AND ae.FechaFin) ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            console.log("getAssignment length:", result.length);
            res.json(result);
        })
    }
    else{
        console.log('Entra aqui');
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM AsignacionEliminada AS ae INNER JOIN Especialista AS e ON ae.IdEspecialista=e.IdEspecialista WHERE ('"+Sdate+"' BETWEEN ae.FechaInicio AND ae.FechaFin) AND (ae.IdEspecialista LIKE '%"+Stext+"%' OR ae.NombreSitio LIKE '%"+Stext+"%' OR ae.NombreContacto LIKE '%"+Stext+"%' OR ae.TelefonoContacto LIKE '%"+Stext+"%' OR ae.Descripcion LIKE '%"+Stext+"%' OR ae.SujetoCancelacion LIKE '%"+Stext+"%' OR ae.RazonCancelacion LIKE '%"+Stext+"%' OR e.NombreE LIKE '%"+Stext+"%') ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            console.log("getAssignment length:", result.length);
            res.json(result);
        })
    }
})

router.post("/updateCoords", (req, res) => {
    let data = req.body;
    console.log("Coords", data);
    let query = "UPDATE ASIGNACION SET CoordenadasEspecialista='" + data.Coords + "' WHERE IdAsignacion=" + data.IdAsignacion + ";";
    if (data.Coords.length != 0) {
        con.query(query, (error, result) => {
            console.log("Dentro de update");
            return res.json( (error)? "true":"false" );
        })
    }
})

module.exports = {
    router,
    startingMysql
};