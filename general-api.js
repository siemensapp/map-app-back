const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const variables = require('./auxiliar/variables');
const jwt = require('jsonwebtoken');
const auxImage = require('./auxiliar/imageFunctions');
const verifyToken = require('./auxiliar/verifyToken');
const auxPush = require('./auxiliar/pushFunction');
var nodemailer = require ('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

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

var fakeDatabase = {};

// Endpoint donde se subscriben a las notificaciones push los usuarios de la aplicacion
router.post('/subscriptionApp', (req, res) => {
    let subscription = req.body;
    fakeDatabase['App'] = subscription;
    res.status(200).json("Subscripcion recibida");
    console.log(fakeDatabase);

});

// Endpoint donde se subscriben a las notificaciones push los usuarios de la aplicacion
router.post('/subscriptionDesktop', (req, res) => {
    let subscription = req.body;
    let query = "UPDATE usuariodesktop SET subscriptionToken='" + JSON.stringify(subscription) + "' WHERE "
    fakeDatabase['Desktop'] = subscription;
    res.status(200).json("Subscripcion recibida");
    console.log(fakeDatabase);
});

// Registrar un nuevo usuario de Desktop, SOLO PARA PRUEBAS Y USO DE BCRYPT
router.post('/registerDesktop', (req, res, err) => {
    let name = req.body.name;
    let email = req.body.email;
    let hashedPassword = bcrypt.hashSync(req.body.password, 8);
    let query = "INSERT INTO UsuarioDesktop (name, email, password) values('" + name + "','" + email + "','" + hashedPassword + "');";
    console.log(query);
    con.query(query, (error, result) => {
        if (error) return res.json("Error en la base de datos");
        else {
            res.json("true");
        }
    })
})

// Registrar un nuevo usuario de App, SOLO PARA PRUEBAS Y USO DE BCRYPT
//se revisa que no hayan duplicados de IdEspecialista
router.post('/registerApp', (req, res, err) => {
    let CedulaCiudadania = req.body.cedula;
    let IdEspecialista = req.body.CedulaCiudadania;
    let hashedPassword = bcrypt.hashSync(req.body.password, 8);
    var queryDuplicado = "SELECT CedulaCiudadania FROM Especialista WHERE IdEspecialista="+IdEspecialista+";";
    con.query(queryDuplicado, (error, result) => {
        if(error){
            console.log("Error consultando duplicado ID");
        }else{
            console.log("Consulta hecha duplicado");
            if(result.length == 0){
                //res.json("true");
                console.log("No hay duplicado ID");
                let query = "INSERT INTO UsuarioApp (CedulaCiudadania, password) values('" + CedulaCiudadania + "','" + hashedPassword + "');";
                console.log(query);
                con.query(query, (error, result) => {
                    if (error){
                        console.log("Error en la base de datos");
                    } else {
                         res.json("true");
                    }
                })
            }else{
                console.log("El ID es duplicado");
                res.json("duplicated");
            }
        }
    })
    
    
})

// El usuario se logea a traves de este endpoint
router.post('/loginApp', (req, res, err) => {
    let query = "SELECT * FROM UsuarioApp WHERE CedulaCiudadania='" + req.body.user + "';";
    con.query(query, (err, result) => {
        if (result.length == 0) return res.json("Usuario no encontrado");
        let comparePassword = bcrypt.compareSync(req.body.password, result[0].password);
        if (!comparePassword) return res.json("Contraseña incorrecta");
        let token = jwt.sign({
            email: result.password
        }, variables.secret, {
            expiresIn: 86400
        })
        let userDataQuery = "SELECT NombreE, Foto from Especialista Where CedulaCiudadania='" + req.body.user + "';";
        con.query(userDataQuery, (err, result) => {
            console.log(result);
            if(result[0] == undefined || err){
                res.json("No esta registrado");
                console.log("ERROR AL TRAER ESPECIALISTA");
            }else{
            return res.send({
                auth: true,
                token: token,
                expiresIn: 86400,
                NombreE: result[0]['NombreE'],
                NombreColaborador: result[0]['NombreE'],
                Foto: auxImage.convertBase64(result[0]['Foto'])
                })
            }
        })
    })
})

//

router.post('/loginDesktop', (req, res, err) => {
    let query = "SELECT * FROM UsuarioDesktop WHERE email='" + req.body.user + "@siemens.com';";
    con.query(query, (err, result) => {
        if (result.length == 0) return res.json("Usuario no encontrado");
        let comparePassword = bcrypt.compareSync(req.body.password, result[0].password);
        if (!comparePassword) return res.json("Contraseña incorrecta");
        let token = jwt.sign({
            email: result.password
        }, variables.secret, {
            expiresIn: 86400
        })
        return res.send({
            auth: true,
            token: token,
            expiresIn: 86400,
            nombre: result[0]['name']
        })
        // let userDataQuery = "SELECT NombreE, Foto from Especialista Where CedulaCiudadania='" + req.body.user +"';";
        // con.query( userDataQuery, (err, result) => {
        //     console.log(result);

        // })
    })
})

// Trae datos de trabajadores en servicio para poner los puntos en el mapa
router.get("/workers/:date", (req, res, err) => {
    console.log("Connected to get")
    let fecha = req.params.date;
    var workersQuery, query = "select Especialista.NombreE, Asignacion.CoordenadasEspecialista from asignacion inner join especialista on Especialista.idespecialista = asignacion.idespecialista where idstatus=1 and '"+fecha+"' between fechainicio and fechafin";
    console.log(query);
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
    con.query("select Especialista.NombreE, Especialista.IdEspecialista, Especialista.IdTecnica, Tecnica.NombreT, Tecnica.IdTecnica from Especialista inner join tecnica on Especialista.IdTecnica = Tecnica.IdTecnica ORDER BY Tecnica.IdTecnica;", (error, result, fields) => {
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
    //let query = "SELECT Especialista.NombreE, Especialista.Celular, Especialista.FechaNacimiento, Especialista.CeCo, Especialista.Foto, Especialista.IdEspecialista, Especialista.GID, Especialista.CedulaCiudadania, Especialista.LugarExpedicion, Especialista.TarjetaIngresoArgos, Especialista.IdTecnica, Tecnica.NombreT,  Asignacion.IdAsignacion, Status.NombreS from Especialista inner join Tecnica on Especialista.IdTecnica=Tecnica.IdTecnica inner join Asignacion on Especialista.IdEspecialista = Asignacion.IdEspecialista inner join status on Asignacion.IdStatus=Status.IdStatus WHERE '" + fecha + "' BETWEEN Asignacion.FechaInicio AND Asignacion.FechaFin";
    let query = "SELECT Especialista.NombreE, Especialista.Celular, Especialista.FechaNacimiento, Especialista.CeCo, Especialista.Foto, Especialista.IdEspecialista as id, Especialista.GID, Especialista.CedulaCiudadania, Especialista.LugarExpedicion, Especialista.TarjetaIngresoArgos, Especialista.IdTecnica, Tecnica.NombreT, IFNULL((SELECT Status.NombreS FROM Status INNER JOIN Asignacion ON Status.IdStatus=Asignacion.IdStatus WHERE IdEspecialista=id AND '"+fecha+"' BETWEEN FechaInicio AND FechaFin), 'Disponible') as Estado, IFNULL((SELECT Asignacion.IdAsignacion FROM Asignacion WHERE IdEspecialista=id AND '"+fecha+"' BETWEEN FechaInicio AND FechaFin), null) as Asignacion FROM Especialista INNER JOIN Tecnica ON Especialista.IdTecnica=Tecnica.IdTecnica;";
    con.query(query, (error, result, fields) => {
        if (error) throw error;
        workersQuery = result;
        for (let worker of workersQuery) {
            worker["FotoBase64"] = auxImage.convertBase64(worker);
        }
        return res.json(workersQuery);
    })
});

//TRAER LOS DATOS DE LAS EMPRESAS AL COMBOBOX DE CREAR ASIGNACION
router.get("/clientList", (req, res, err) => {
    let query = "SELECT * FROM Empresa";
    con.query(query, (error, result, fields) => {
        if (error) return res.json("Hubo un error al traer las empresas");
        return res.json(result);
    })
});

// Crea asignacion 
router.post("/setAssignment", (req, res, err) => {
    let data = req.body;
    let IdEspecialista = data.IdEspecialista;
    let FechaInicio = data.FechaInicio;
    let FechaFin = data.FechaFin;
    let checkQuery = "SELECT * FROM Asignacion WHERE IdEspecialista = " + IdEspecialista + " AND ('" + FechaInicio + "' BETWEEN FechaInicio AND FechaFin OR '" + FechaFin + "' BETWEEN FechaInicio AND FechaFin)";
    con.query(checkQuery, (error, result) => {
        if (error) return res.json("false checkquery");
        if (result.length !== 0) return res.json("existe");
        let IdEspecialista = data.IdEspecialista;
        let IdStatus = data.IdStatus;
        let NombreCliente = data.NombreCliente;
        let NombrePlanta = data.NombrePlanta;
        let CiudadPlanta = data.CiudadPlanta;
        let NombreContacto = data.NombreContacto;
        let TelefonoContacto = data.TelefonoContacto;
        let EmailContacto = data.EmailContacto;
        let Descripcion = data.Descripcion;
        let CoordenadasSitio = data.CoordenadasSitio;
        let NombreSitio = data.NombreSitio;
        let PCFSV = data.PCFSV;
        let IdEmpresa;

        let tipoServicio;
        if(PCFSV == 'P'){tipoServicio = 'Preventivo planeado'}
        else if(PCFSV == 'C'){tipoServicio = 'Correctivo planeado'}
        else if(PCFSV == 'F'){tipoServicio = 'Pruebas FAT'}
        else if(PCFSV == 'S'){tipoServicio = 'Puesta en servicio'}
        else if(PCFSV == 'V'){tipoServicio = 'Soporte ventas'}
        else{tipoServicio = 'OTRO'}

        let query1 = "SELECT IdEmpresa FROM Empresa WHERE NombreEmpresa='" + NombreCliente + "';";
        con.query(query1, (error, result) => {
            console.log(query1);
            if (error) console.log("ERROR");
            IdEmpresa = result[0]['IdEmpresa'];
            let insertQuery = "INSERT INTO Asignacion (PCFSV, IdEspecialista, IdStatus, StatusAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, TiempoInicio, TiempoFinal, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion) VALUES('" + PCFSV + "', " + IdEspecialista + "," + IdStatus + ", 0, " + IdEmpresa + ", '" + NombrePlanta + "', '" + CiudadPlanta + "', '" + FechaInicio + "', '" + FechaFin + "', null, null, '" + CoordenadasSitio + "', '', '" + NombreSitio + "', '" + NombreContacto + "', '" + TelefonoContacto + "', '" + EmailContacto + "', '" + Descripcion + "')";
            con.query(insertQuery, (error, result) => {
                console.log(error);
                // auxPush.notifNewAssignment(fakeDatabase['App'], 'newAssignment');
                if(error){
                    res.json("false")
                }else{
                    let transporter = nodemailer.createTransport({
                        service: "Gmail",
                        secure: false,
                        port: 25,
                        auth:{
                            user:"asiganacionsiemens@gmail.com",
                            pass:"Siemens123.abc$",
                        },
                        tlsl:{
                            rejectUnauthorized:false
                        }
                    });

                    let HelperOptions={
                        from:"'Asignación Siemens' <asignacionsiemens@gmail.com",
                        to: "nicolas.ricardo_enciso@siemens.com",
                        subject: "Nueva asignación Field Service Siemens",
                        text:"Tiene una nueva asignación desde SISTEMA PARA GESTION DE FIELD SERVICE: ",
                        html: 
                              "<h2>Asignación</h2>"+
                              "<p>Usted ha recibido una asignación de trabajo field service, a continuación podrá ver la información al respecto:  </p>"+
                              '<table style="width:100%; border: 1px solid black;border-collapse: collapse;">'+
                                    "<tr>"+
                                        "<th style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Campo</th>"+
                                        "<th style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Informacion</th>"+
                                    "</tr>"+
                                    "<tr>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Nombre del cliente</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+NombreCliente+"</td>"+
                                    "</tr>"+
                                    "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Nombre planta</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+NombrePlanta+"</td>"+
                                    "</tr>"+
                                    "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Ciudad planta</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+CiudadPlanta+"</td>"+
                                    "</tr>"+
                                    "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Nombre contacto</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+NombreContacto+"</td>"+
                                    "</tr>"+
                                    "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Telefono contacto</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+TelefonoContacto+"</td>"+
                                    "</tr>"+
                                    "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Email Contacto</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+EmailContacto+"</td>"+
                                    "</tr>"+
                                    "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Descripcion</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+Descripcion+"</td>"+
                                    "</tr>"+
                                    "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Tipo de servicio</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+tipoServicio+"</td>"+
                                    "</tr>"+
                                "</table>"+
                                "<br>"+
                                "<p>Puede consultar la asignacion completa en el aplicativo Movil con su cuenta</p>"

                    }

                    transporter.sendMail(HelperOptions, function(err,res){
                        if (err){
                            console.log(err);
                            console.log("No se envio**********");
                        }else{
                            console.log("Si se envio");
                        }
                    });
                    return res.json("true");
                }
            });
        });
    })
});



// Borra usuario dado un id y tambien sus asignaciones
//modificado para borrar por nombre y no por id, workerId = NombreE
router.get("/deleteWorker/:workerId", (req, res, err) => {
    console.log("Entered delete");
    con.query("delete from Especialista Where NombreE='" + req.params.workerId + "';", (error, result, fields) => {
       // console.log("---------------");
        //console.log(req.params.workerId);
        //console.log("---------------");
        res.json((error) ? "false" : "true")
        console.log(error);
    })
});


//Borra un usuarioApp por la cedula
router.get("/deleteUserApp/:CedulaCiudadania", (req, res, err) => {
    console.log("Deleting user app start");
    console.log(req.params.CedulaCiudadania);
    con.query("DELETE FROM usuarioapp WHERE CedulaCiudadania='"+req.params.CedulaCiudadania+"';", (error, result, fields) => {
        if(error){
            res.json("false");
            console.log("Error al eliminar user app");
        }else{
            res.json("true");
            console.log("User app eliminado");
        }
    })
});



// Crea nuevos trabajadores
//se revisa que no hayan duplicados de IdEspecialista
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
    let base64String, base64Image, imagePath;

    var queryDuplicado = "SELECT CedulaCiudadania FROM Especialista WHERE IdEspecialista="+IdEspecialista+";";
    con.query(queryDuplicado, (error, result) => {
        if(error){
            console.log("Error consultando duplicado ID");
        }else{
            console.log("Consulta hecha duplicado");
            if(result.length == 0){
                res.json("true");
                console.log("No hay duplicado ID");
                var query = "INSERT INTO Especialista(IdEspecialista, CeCo, NombreE, TarjetaIngresoArgos, Celular, GID, CedulaCiudadania, LugarExpedicion, FechaNacimiento, IdTecnica) VALUES(" + IdEspecialista + ",'" + CeCo + "','" + NombreE + "','" + TarjetaIngresoArgos + "','" + Celular + "','" + GID + "','" + CedulaCiudadania + "','" + LugarExpedicion + "','" + FechaNacimiento + "'," + IdTecnica+ "')";
                if (data.Foto) {
                    base64String = data.Foto;
                    base64Image = base64String.split(';base64,').pop();
                    imagePath = variables.serverDirectoryWin + 'images\\\\Foto_' + data.IdEspecialista + ".jpg";
                    query = "INSERT INTO Especialista(IdEspecialista, CeCo, NombreE, TarjetaIngresoArgos, Celular, GID, CedulaCiudadania, LugarExpedicion, FechaNacimiento, IdTecnica, Foto) VALUES(" + IdEspecialista + ",'" + CeCo + "','" + NombreE + "','" + TarjetaIngresoArgos + "','" + Celular + "','" + GID + "','" + CedulaCiudadania + "','" + LugarExpedicion + "','" + FechaNacimiento + "'," + IdTecnica + ",'" + imagePath+ "')";
                }else{
                    imagePath = variables.serverDirectoryWin + "images\\\\default-user.png";
                    query = "INSERT INTO Especialista(IdEspecialista, CeCo, NombreE, TarjetaIngresoArgos, Celular, GID, CedulaCiudadania, LugarExpedicion, FechaNacimiento, IdTecnica, Foto) VALUES(" + IdEspecialista + ",'" + CeCo + "','" + NombreE + "','" + TarjetaIngresoArgos + "','" + Celular + "','" + GID + "','" + CedulaCiudadania + "','" + LugarExpedicion + "','" + FechaNacimiento + "'," + IdTecnica + ",'" + imagePath+ "')";
                }
                console.log(imagePath);
                con.query(query, async (error, result, fields) => {
                    if (data.Foto) {
                        console.log(" ENTRA A QUERY ");
                        console.log(error);
                        console.log(" MOSTRO ERROR ")
                        auxImage.saveImage(imagePath, base64Image).then((imageResult) => {
                            console.log(imageResult)
                            res.json(imageResult);
                        })
                    } else res.json((error) ? "false" : "true");
                    console.log(error);
                    console.log("SALE");
                })
            }else{
                console.log("ERROR ID duplicado");
                res.json("duplicated");
            }
        }
    })



    
});



//Para editar usuarios en desktop
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
    let base64String, base64Image, imagePath;

    let promesaInicial = new Promise((resolve, reject) => {
    var query = "SELECT CedulaCiudadania FROM Especialista WHERE IdEspecialista=" + IdEspecialista+";";
        con.query(query, (error, result) => {
            if(error){
                console.log("Error al traer cedula");
                //res.json("false");
                reject();
            }else{
                console.log(result[0]['CedulaCiudadania']);
                console.log("Exito al traer cedula");
                //res.json("true");        
                resolve(result);
            }
        })
    });  
    
    promesaInicial.then((result) => {
        //console.log("SEGUNDO QUERY**************");
        var antiguaCedula = result[0]['CedulaCiudadania'];
        let hashedPassword = bcrypt.hashSync(CedulaCiudadania, 8);
        var query2 = "UPDATE usuarioapp SET CedulaCiudadania='" + CedulaCiudadania + "', password='"+ hashedPassword + "' WHERE CedulaCiudadania='"+antiguaCedula+ "';";
        console.log(query2);
        con.query(query2, (error2, result2) => {
            if(error2){
                console.log("Error al actualizar cedula AppMovil");
                //res.json("false");
            }else{
                console.log("Se ha actualizado exitosamente AppMovil");
                //res.json("true");
            }
        })
    }).then((result) => {
        var query3 = "UPDATE Especialista SET NombreE='" + NombreE + "',Celular='" + Celular + "',IdTecnica=" + IdTecnica + ",FechaNacimiento='" + FechaNacimiento + "',CeCo='" + CeCo + "',GID='" + GID + "',CedulaCiudadania='" + CedulaCiudadania + "',LugarExpedicion='" + LugarExpedicion + "',TarjetaIngresoArgos='" + TarjetaIngresoArgos + "' WHERE IdEspecialista=" + IdEspecialista;
        if (data.Foto) {
            base64String = data.Foto;
            base64Image = base64String.split(';base64,').pop();
            imagePath = variables.serverDirectoryWin + 'images\\\\Foto_' + data.IdEspecialista + ".jpg";
            query3 = "UPDATE Especialista SET NombreE='" + NombreE + "',Celular='" + Celular + "',IdTecnica=" + IdTecnica + ",FechaNacimiento='" + FechaNacimiento + "',CeCo='" + CeCo + "',GID='" + GID + "',CedulaCiudadania='" + CedulaCiudadania + "',LugarExpedicion='" + LugarExpedicion + "',TarjetaIngresoArgos='" + TarjetaIngresoArgos + "',Foto='" + imagePath + "' WHERE IdEspecialista=" + IdEspecialista;
        }
        //console.log(imagePath);
        con.query(query3, async (error, result, fields) => {
            if (data.Foto) {
                auxImage.saveImage(imagePath, base64Image).then((imageResult) => {
                    res.json(imageResult);
                })
            } else res.json((error) ? "false" : "true");
        })
    });
})
    

// Trae asignaciones dada una fecha (mes y año) del cronograma
router.get('/getAssignments/:date', (req, res, err) => {
    let auxDate = req.params.date.split("-");
    console.log(req.params.date);
    let query = "SELECT * FROM asignacion where (EXTRACT(YEAR_MONTH FROM '" + req.params.date + "') BETWEEN EXTRACT(YEAR_MONTH FROM fechaInicio) and EXTRACT(YEAR_MONTH FROM fechaFin ));";
    con.query(query, (error, result) => {
        if (error) return res.json("HUbo un error");
        console.log("getAssignment length:", result.length);
        res.json(result);
    })
})

// Trae asignaciones de un especialista dada la cedula de ciudadania
router.get('/getWorkerAssignments/:worker', (req, res, err) => {
    let worker = req.params.worker;
    let query = "SELECT * from Asignacion INNER JOIN Especialista ON Especialista.IdEspecialista=Asignacion.IdEspecialista INNER JOIN Empresa ON Asignacion.IdEmpresa=Empresa.IdEmpresa WHERE Especialista.CedulaCiudadania='" + worker + "' ORDER BY IdAsignacion DESC LIMIT 30;";
    // let query = "SELECT * from Asignacion INNER JOIN Especialista ON Especialista.IdEspecialista=Asignacion.IdEspecialista WHERE Especialista.CedulaCiudadania='10236';";
    con.query(query, (error, result) => {
        if (error) return res.json("Hubo un error");
        res.json(result);
    })
})

// Trae info de las asignaciones de un trabajador
router.get('/getInfoAssignment/:id/:date', (req, res, err) => {
    let id = req.params.id;
    let date = req.params.date;
    let query = " SELECT Especialista.NombreE, Tecnica.NombreT, Status.NombreS, Asignacion.IdEspecialista, Asignacion.PCFSV, Asignacion.IdStatus, Asignacion.IdAsignacion, Empresa.NombreEmpresa, Empresa.IdEmpresa, Asignacion.NombrePlanta, Asignacion.CiudadPlanta, Asignacion.StatusAsignacion, Asignacion.FechaInicio, Asignacion.FechaFin, Asignacion.NombreSitio, Asignacion.NombreContacto, Asignacion.TelefonoContacto, Asignacion.EmailContacto, Asignacion.Descripcion, Asignacion.CoordenadasSitio, Asignacion.CoordenadasEspecialista FROM Especialista INNER JOIN Tecnica ON Especialista.IdTecnica=Tecnica.IdTecnica INNER JOIN Asignacion ON Especialista.IdEspecialista=Asignacion.IdEspecialista INNER JOIN Status ON Asignacion.IdStatus=Status.IdStatus INNER JOIN Empresa ON Asignacion.IdEmpresa=Empresa.IdEmpresa WHERE Asignacion.IdEspecialista=" + id + " AND '" + date + "' BETWEEN Asignacion.FechaInicio AND Asignacion.FechaFin;";
    // let query = "SELECT * from Asignacion INNER JOIN Especialista ON Especialista.IdEspecialista=Asignacion.IdEspecialista WHERE Especialista.CedulaCiudadania='10236';";
    con.query(query, (error, result) => {
        if (error) return res.json("Hubo un error");
        res.json(result);
    })
})

// Borra asignacion en las fechas especificadas dado el id del especialista y la fecha
router.post("/deleteAssignment/", (req, res, err) => {
    let query;
    let query2;
    let query3;
    let body = req.body;
    let desde = new Date(body.Desde);
    let hasta = new Date(body.Hasta);
    let fechaInicio = new Date(body.FechaInicio);
    let fechaFin = new Date(body.FechaFin);
    //Diferencia entre Desde y FechaInicio
    let diffDate1 = Math.abs(desde.getTime() - fechaInicio.getTime());
    let diffDays1 = Math.ceil(diffDate1 / (1000 * 60 * 60 * 24));

    //Diferencia entre Hasta y FechaFin
    let diffDate2 = Math.abs(fechaFin.getTime() - hasta.getTime());
    let diffDays2 = Math.ceil(diffDate2 / (1000 * 60 * 60 * 24));

    //Primer Caso Desde = FechaInicio && Hasta < FechaFin
    if (diffDays1 == 0 && diffDays2 > 0) {
        let fechaN = new Date();
        fechaN.setDate(hasta.getDate() + 2);
        fechaN.setMonth(hasta.getMonth());
        fechaN.setHours(fechaN.getHours() - 5);
        query = "UPDATE Asignacion SET FechaInicio='" + fechaN.toISOString().split("T")[0] + "' WHERE IdAsignacion=" + body.IdAsignacion + "";
        con.query(query, (error, result, fields) => {
            if (error) console.log('Error eliminacion 1ra parte:', error);
            query2 = "INSERT INTO AsignacionEliminada (PCFSV, IdEspecialista, IdStatus, IdAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion, SujetoCancelacion, RazonCancelacion) VALUES('" + body.PCFSV + "', " + body.IdEspecialista + ", " + body.IdStatus + ", " + body.IdAsignacion + ", " + body.IdEmpresa + ", '" + body.NombrePlanta + "', '" + body.CiudadPlanta + "', '" + desde.toISOString().split("T")[0] + "', '" + hasta.toISOString().split("T")[0] + "', '" + body.CoordenadasSitio + "', '', '" + body.NombreSitio + "', '" + body.NombreContacto + "', '" + body.TelefonoContacto + "', '" + body.EmailContacto + "', '" + body.Descripcion + "' ,'" + body.SujetoCancelacion + "', '" + body.RazonCancelacion + "');";
            con.query(query2, (err, result, fields) => {
                if(err) console.log('Error eliminacion 2da parte:', err);
                return res.json((err) ? "false" : "true")
            })
        })
    }

    //Segundo Caso Desde > FechaInicio && Hasta < FechaFin
    else if (diffDays1 > 0 && diffDays2 > 0) {
        let fechaFNOrinigal = new Date();
        fechaFNOrinigal.setDate(desde.getDate());
        fechaFNOrinigal.setMonth(desde.getMonth());
        fechaFNOrinigal.setHours(fechaFNOrinigal.getHours() - 5);
        console.log(fechaFNOrinigal);
        let fechaINueva = new Date();
        fechaINueva.setDate(hasta.getDate() + 2);
        fechaINueva.setMonth(hasta.getMonth());
        fechaINueva.setHours(fechaINueva.getHours() - 5);
        query = "UPDATE Asignacion SET FechaFin='" + fechaFNOrinigal.toISOString().split("T")[0] + "' WHERE IdAsignacion=" + body.IdAsignacion + "";
        con.query(query, (error, result, fields) => {
            if (error) console.log('Error eliminacion 1ra parte:', error);
            query2 = "INSERT INTO AsignacionEliminada (PCFSV, IdEspecialista, IdStatus, IdAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion, SujetoCancelacion, RazonCancelacion) VALUES('" + body.PCFSV + "', " + body.IdEspecialista + ", " + body.IdStatus + ", " + body.IdAsignacion + ", '" + body.IdEmpresa + "', '" + body.NombrePlanta + "', '" + body.CiudadPlanta + "', '" + desde.toISOString().split("T")[0] + "', '" + hasta.toISOString().split("T")[0] + "', '" + body.CoordenadasSitio + "', '', '" + body.NombreSitio + "', '" + body.NombreContacto + "', '" + body.TelefonoContacto + "', '" + body.EmailContacto + "', '" + body.Descripcion + "' ,'" + body.SujetoCancelacion + "', '" + body.RazonCancelacion + "');";
            con.query(query2, (err, result, fields) => {
                if (err) console.log('Error eliminacion 2da parte:', err);
                query3 = "INSERT INTO Asignacion (PCFSV, IdEspecialista, IdStatus, StatusAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, TiempoInicio, TiempoFinal, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion) VALUES('" + body.PCFSV + "', " + body.IdEspecialista + "," + body.IdStatus + ", 0, '" + body.IdEmpresa + "', '" + body.NombrePlanta + "', '" + body.CiudadPlanta + "', '" + fechaINueva.toISOString().split("T")[0] + "', '" + fechaFin.toISOString().split("T")[0] + "', null, null, '" + body.CoordenadasSitio + "', '', '" + body.NombreSitio + "', '" + body.NombreContacto + "', '" + body.TelefonoContacto + "', '" + body.EmailContacto + "', '" + body.Descripcion + "')";
                con.query(query3, (er, result, fields) => {
                    if (er) console.log('Error eliminacion 3ra parte:', er);
                    return res.json((er) ? "false" : "true")
                })
            })
        })
    }

    //Tercer Caso Desde > FechaInicio && Hasta = FechaFin
    else if (diffDays1 > 0 && diffDays2 == 0) {
        let fechaFN = new Date();
        fechaFN.setDate(desde.getDate());
        fechaFN.setMonth(desde.getMonth());
        fechaFN.setHours(fechaFN.getHours() - 5);
        console.log(fechaFN);
        query = "UPDATE Asignacion SET FechaFin='" + fechaFN.toISOString().split("T")[0] + "' WHERE IdAsignacion=" + body.IdAsignacion + "";
        con.query(query, (error, result, fields) => {
            if (error) console.log('Error eliminacion 1ra parte:', error);
            query2 = "INSERT INTO AsignacionEliminada (PCFSV, IdEspecialista, IdStatus, IdAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion, SujetoCancelacion, RazonCancelacion) VALUES('" + body.PCFSV + "', " + body.IdEspecialista + ", " + body.IdStatus + ", " + body.IdAsignacion + ", '" + body.IdEmpresa + "', '" + body.NombrePlanta + "', '" + body.CiudadPlanta + "', '" + desde.toISOString().split("T")[0] + "', '" + hasta.toISOString().split("T")[0] + "', '" + body.CoordenadasSitio + "', '', '" + body.NombreSitio + "', '" + body.NombreContacto + "', '" + body.TelefonoContacto + "', '" + body.EmailContacto + "', '" + body.Descripcion + "' ,'" + body.SujetoCancelacion + "', '" + body.RazonCancelacion + "');";
            con.query(query2, (err, result, fields) => {
                if (err) console.log('Error eliminacion 2da parte:', err);;
                return res.json((err) ? "false" : "true")
            })
        })
    }

    //Cuarto Caso Desde = FechaInicio && Hasta = FechaFin
    else if (diffDays1 == 0 && diffDays2 == 0) {
        query = "DELETE FROM Asignacion WHERE IdAsignacion=" + body.IdAsignacion + "";
        con.query(query, (error, result, fields) => {
            if (error) console.log('Error eliminacion 1ra parte:', error);
            query2 = "INSERT INTO AsignacionEliminada (PCFSV, IdEspecialista, IdStatus, IdAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion, SujetoCancelacion, RazonCancelacion) VALUES('" + body.PCFSV + "', " + body.IdEspecialista + ", " + body.IdStatus + ", " + body.IdAsignacion + ", '" + body.IdEmpresa + "', '" + body.NombrePlanta + "', '" + body.CiudadPlanta + "', '" + desde.toISOString().split("T")[0] + "', '" + hasta.toISOString().split("T")[0] + "', '" + body.CoordenadasSitio + "', '', '" + body.NombreSitio + "', '" + body.NombreContacto + "', '" + body.TelefonoContacto + "', '" + body.EmailContacto + "', '" + body.Descripcion + "' ,'" + body.SujetoCancelacion + "', '" + body.RazonCancelacion + "');";
            console.log(query2);
            con.query(query2, (error, result, fields) => {
                if (error) error;;
                return res.json((error) ? "false" : "true")
            })
        })
    }
});


//Edita una asignacion dada
router.post("/updateAssignment/", (req, res, err) =>{
    let body = req.body;
    let query = 'UPDATE asignacion SET IdEspecialista='+body.IdEspecialista+' , '+
                                        'IdStatus='+body.IdStatus+', '+
                                        'PCFSV="'+body.PCFSV+'", '+
                                        'IdEmpresa='+body.IdEmpresa+', '+
                                        'NombrePlanta="'+body.NombrePlanta+'", '+
                                        'CiudadPlanta="'+body.CiudadPlanta+'", '+
                                        'StatusAsignacion='+body.StatusAsignacion+', '+
                                        'FechaInicio="'+body.FechaInicio+'", '+
                                        'FechaFin="'+body.FechaFin+'", '+
                                        'CoordenadasSitio="'+body.CoordenadasSitio+'", '+
                                        'CoordenadasEspecialista="'+body.CoordenadasEspecialista+'", '+
                                        'NombreSitio="'+body.NombreSitio+'", '+
                                        'NombreContacto="'+body.NombreContacto+'", '+
                                        'TelefonoContacto="'+body.TelefonoContacto+'", '+
                                        'EmailContacto="'+body.EmailContacto+'", '+
                                        'Descripcion="'+body.Descripcion+' " WHERE IdAsignacion='+body.IdAsignacion+ ';';
                                        console.log("QUERY");
                                        console.log(query);
    con.query(query, (error, result) => {
        if (error){ 
            console.log(error);
            return res.json("false");
        }else{
            console.log("Query enviado")
            return res.json("true");
        }
    })
})


// Trae las asignaciones del mes
router.get("/getMonthAssignments/:date", (req, res, err) => {
    let date = req.params.date;
    let query = "SELECT Asignacion.IdEspecialista, Asignacion.IdStatus, Asignacion.FechaInicio, Asignacion.FechaFin, Especialista.IdTecnica as tecnica, Especialista.NombreE, (SELECT COUNT(*) FROM Especialista WHERE IdTecnica=tecnica) as Cuenta FROM Asignacion INNER JOIN Especialista ON Asignacion.IdEspecialista=Especialista.IdEspecialista WHERE YEAR(Asignacion.FechaInicio) = YEAR('" + date + "') AND MONTH(Asignacion.FechaInicio)=MONTH('" + date + "') OR YEAR(Asignacion.FechaFin) = YEAR('" + date + "') AND MONTH(Asignacion.FechaFin) = MONTH('" + date + "');";
    con.query(query, (error, result) => {
        if (error) return res.json("Error");
        return res.json(result);
    })
})

// Trae las asignaciones del año
router.get("/getYearAssignments/:date", (req, res, err) => {
    let date = req.params.date;
    let yearMonth1;
    let yearMonth2;
    if(date.split("-")[1]<10){
        yearMonth1 = (parseInt(date.split("-")[0]) - 1) + '10';
        yearMonth2 = date.split("-")[0] + '09';
    }
    else{
        yearMonth1 = date.split("-")[0] + '10';
        yearMonth2 = (parseInt(date.split("-")[0]) + 1) + '09';
    }
    let query = "SELECT Asignacion.IdEspecialista, Asignacion.IdStatus, Asignacion.FechaInicio, Asignacion.FechaFin, Especialista.IdTecnica as tecnica, (SELECT COUNT(*) FROM Especialista WHERE IdTecnica=tecnica) as Cuenta FROM Asignacion INNER JOIN Especialista ON Asignacion.IdEspecialista=Especialista.IdEspecialista WHERE (EXTRACT(YEAR_MONTH FROM FechaInicio) BETWEEN '"+yearMonth1+"' AND '"+yearMonth2+"') OR (EXTRACT(YEAR_MONTH FROM FechaFin) BETWEEN '"+yearMonth1+"' AND '"+yearMonth2+"');";
    console.log(query);
    con.query(query, (error, result) => {
        if (error) return res.json("Error");
        return res.json(result);
    })
})

// Trae TODAS las asignaciones eliminadas
router.get('/getDeletedAssignments/:date/:text', (req, res, err) => {
    let Sdate = req.params.date;
    let Stext = req.params.text;
    console.log(Sdate, Stext);
    if (Sdate == "'null'" && Stext == "'null'") {
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM AsignacionEliminada AS ae INNER JOIN Especialista AS e ON ae.IdEspecialista=e.IdEspecialista ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            console.log("getAssignment length:", result.length);
            res.json(result);
        })
    } else if (Sdate == "'null'" && Stext !== "'null'") {
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM AsignacionEliminada AS ae INNER JOIN Especialista AS e ON ae.IdEspecialista=e.IdEspecialista WHERE (ae.IdEspecialista LIKE '%" + Stext + "%' OR ae.NombreSitio LIKE '%" + Stext + "%' OR ae.NombreContacto LIKE '%" + Stext + "%' OR ae.TelefonoContacto LIKE '%" + Stext + "%' OR ae.Descripcion LIKE '%" + Stext + "%' OR ae.SujetoCancelacion LIKE '%" + Stext + "%' OR ae.RazonCancelacion LIKE '%" + Stext + "%' OR e.NombreE LIKE '%" + Stext + "%') ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            console.log("getAssignment length:", result.length);
            res.json(result);
        })
    } else if (Sdate !== "'null'" && Stext == "'null'") {
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM AsignacionEliminada AS ae INNER JOIN Especialista AS e ON ae.IdEspecialista=e.IdEspecialista WHERE ('" + Sdate + "' BETWEEN ae.FechaInicio AND ae.FechaFin) ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            console.log("getAssignment length:", result.length);
            res.json(result);
        })
    } else {
        console.log('Entra aqui');
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM AsignacionEliminada AS ae INNER JOIN Especialista AS e ON ae.IdEspecialista=e.IdEspecialista WHERE ('" + Sdate + "' BETWEEN ae.FechaInicio AND ae.FechaFin) AND (ae.IdEspecialista LIKE '%" + Stext + "%' OR ae.NombreSitio LIKE '%" + Stext + "%' OR ae.NombreContacto LIKE '%" + Stext + "%' OR ae.TelefonoContacto LIKE '%" + Stext + "%' OR ae.Descripcion LIKE '%" + Stext + "%' OR ae.SujetoCancelacion LIKE '%" + Stext + "%' OR ae.RazonCancelacion LIKE '%" + Stext + "%' OR e.NombreE LIKE '%" + Stext + "%') ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            console.log("getAssignment length:", result.length);
            res.json(result);
        })
    }
})

router.post("/updateCoords", (req, res) => {
    let data = req.body;
    console.log("COORDENADAS ESPECIALISTA");
    console.log("Coords", data);
    let query = "UPDATE Asignacion SET CoordenadasEspecialista='" + data.Coords + "' WHERE IdAsignacion=" + data.IdAsignacion + ";";
    
    if (data.Coords.length != 0) {
        con.query(query, (error, result) => {
            console.log("Dentro de update");
            return res.json((error) ? "true" : "false");
        })
    }
})

router.post("/saveGeneralReport", (req, res) => {
    var data = req.body;

    let Consecutivo = data.Consecutivo;
    let NombreCliente = data.NombreCliente;
    let NombreContacto = data.NombreContacto;
    let NombreColaborador = data.NombreColaborador;
    let NombreProyecto = data.NombreProyecto;
    let DescripcionAlcance = data.DescripcionAlcance;
    let HojaTiempo = JSON.stringify(data.HojaTiempo);
    let Marca = data.Marca;
    let DenominacionInterna = data.DenominacionInterna;
    let NumeroProducto = data.NumeroProducto;
    let NumeroSerial = data.NumeroSerial;
    let CaracteristicasTecnicas = data.CaracteristicasTecnicas;
    let EstadoInicial = data.EstadoInicial;
    let ActividadesRealizadas = data.ActividadesRealizadas;
    let Conclusiones = data.ConclusionesRecomendaciones;
    let RepuestosSugeridos = data.RepuestosSugeridos;
    let ActividadesPendientes = data.ActividadesPendientes;
    let FirmaEmisor = data.FirmaEmisor;
    let FirmaCliente = data.FirmaCliente;
    let IdAsignacion = data.IdAsignacion;
    let FechaEnvio = data.FechaEnvio;
    let Adjuntos = JSON.stringify(data.Adjuntos);

    let IdEmpresa = Consecutivo.split("-")[0];

    //INSERTAR EN REPORTE GENERAL
    let query = "Insert into ReporteGeneral(Consecutivo, IdEmpresa, NombreContacto, NombreColaborador, NombreProyecto, DescripcionAlcance, HojaTiempo, Marca, DenominacionInterna, NumeroProducto, NumeroSerial, CaracteristicasTecnicas, EstadoInicial, ActividadesRealizadas, Conclusiones, RepuestosSugeridos , ActividadesPendientes, FirmaEmisor , FirmaCliente, IdAsignacion, FechaEnvio, Adjuntos) VALUES ('" + Consecutivo + "', " + IdEmpresa + ", '" + NombreContacto + "', '" + NombreColaborador + "', '" + NombreProyecto + "', '" + DescripcionAlcance + "', '" + HojaTiempo + "', '" + Marca + "', '" + DenominacionInterna + "', '" + NumeroProducto + "', '" + NumeroSerial + "', '" + CaracteristicasTecnicas + "', '" + EstadoInicial + "', '" + ActividadesRealizadas + "', '" + Conclusiones + "', '" + RepuestosSugeridos + "', '" + ActividadesPendientes + "', '" + FirmaEmisor + "', '" + FirmaCliente + "', " + IdAsignacion + ", '" + FechaEnvio + "', '" + Adjuntos + "');";
    con.query(query, (error, result) => {
        console.log(error);
        return res.json((error) ? "false" : "true");
    })
});


router.post('/updateTimeStamps', (req, res, err) => {
    let tiempoInicio = req.body.tiempoInicio;
    let tiempoFin = req.body.tiempoFin;
    let IdAsignacion = req.body.IdAsignacion;
    var status = req.body.StatusAsignacion;
    console.log(req.body);
    if (tiempoFin == '' && tiempoInicio !== "") {
        let query = "UPDATE Asignacion SET TiempoInicio = '" + tiempoInicio + "', StatusAsignacion=" + status + " WHERE IdAsignacion=" + IdAsignacion + "";
        console.log(query);
        con.query(query, (error, result) => {
            if (error) return res.json("Error en la base de datos");
            else {
                // auxPush.notifNewAssignment(fakeDatabase['Desktop'], 'assignmentStarted');
                return res.json("Registro actualizado");
            }
        })
    } else if (tiempoInicio == "" && tiempoFin !== '') {
        let query = "UPDATE Asignacion SET TiempoFinal = '" + tiempoFin + "', StatusAsignacion=" + status + " WHERE IdAsignacion=" + IdAsignacion + "";
        console.log(query);
        con.query(query, (error, result) => {
            if (error) return res.json("Error en la base de datos");
            else {
                res.json("Registro actualizado");
            }
        })
    } else {
        let query = "UPDATE Asignacion SET StatusAsignacion=" + status + " WHERE IdAsignacion=" + IdAsignacion + "";
        console.log(query);
        con.query(query, (error, result) => {
            if (error) return res.json("Error en la base de datos");
            else {
                res.json("Registro actualizado");
            }
        })
    }
    //console.log(query);
})

/**-------------------------    EQUIPO ---------------------------------- */

//Traer Cliente, Serial y Tipo ( Se puede filtrar por Empresa, TipoEquipo, MLFB)
router.post("/getEquipmentsBy", (req, res) => {

    let NombreEmpresa = (req.body.nombre == undefined) ? "" : req.body.nombre;
    let TipoEquipo = (req.params.tipo) ? "" : req.body.tipo;
    let MLFB = (req.params.mlfb) ? "" : req.body.mlfb;
    let Serial = (req.params.serial)? "" : req.body.serial;
    let query = "SELECT Equipo.NumeroSerial, Empresa.NombreEmpresa, Equipo.TipoEquipo FROM Equipo INNER JOIN Empresa ON Equipo.IdEmpresa=Empresa.IdEmpresa WHERE Empresa.NombreEmpresa LIKE '%" + NombreEmpresa + "%' AND Equipo.TipoEquipo LIKE '%" + TipoEquipo + "%' AND Equipo.MLFB LIKE '%" + MLFB + "%' AND Equipo.NumeroSerial LIKE '%" + Serial + "%';";
    console.log(req.body);
    console.log(query);
    con.query(query, (error, result) => {
        if (error) return res.json("Hubo un error");
        res.json(result);

    })
})


//Traer datos del Equipo por Serial
router.get("/getEquipmentBySerial/:serial", (req, res) => {
    let NumeroSerial = req.params.serial
    let query = "SELECT Equipo.NumeroSerial, Empresa.NombreEmpresa, Equipo.MLFB, Equipo.TipoEquipo, Equipo.Descripcion, Equipo.CicloVida, Equipo.FechaProduccion, Equipo.AñosOperacion, Equipo.NumeroContrato, Equipo.Planta, Equipo.Ciudad, Equipo.Fecha, Equipo.Periodo, Equipo.Vence, Equipo.NombreResponsable, Equipo.TelefonoResponsable, Equipo.EmailResponsable, Equipo.NombrePM, Equipo.TelefonoPM, Equipo.EmailPM FROM Equipo INNER JOIN Empresa ON Equipo.IdEmpresa=Empresa.IdEmpresa WHERE Equipo.NumeroSerial='" + NumeroSerial + "';";

    con.query(query, (error, result) => {
        if (error) return res.json("Hubo un error");
        res.json(result);
    })
})

// Crear equipo nuevo
router.post("/createEquipment", (req, res) => {
    let AñosOperacion = (req.body.AnnosOperacion == "")? 0: req.body.AnnosOperacion;
    let Ciudad = req.body.Ciudad;
    let Descripcion = req.body.Descripcion;
    let EmailPM = req.body.EmailPM;
    let EmailResponsable = req.body.EmailResponsable;
    let Fecha = (req.body.Fecha == "")? '0000-00-00': PaymentRequest.body.Fecha;
    let FechaProduccion = (req.body.FechaProduccion == "")? '0000-00-00': req.body.FechaProduccion;
    let MLFB = req.body.MLFB;
    let NombreCliente = req.body.NombreCliente;
    let NombrePM = req.body.NombrePM;
    let NumeroContrato = req.body.NumeroContrato;
    let NumeroSerial = req.body.NumeroSerial;
    let Periodo = req.body.Periodo;
    let Planta = req.body.Planta;
    let NombreResponsable = req.body.Responsable;
    let TelefonoPM = req.body.TelefonoPM;
    let TelefonoResponsable = req.body.TelefonoResponsable;
    let TipoEquipo = req.body.TipoEquipo;
    let CicloVida = req.body.CicloVida;
    let Vence = (req.body.Vence == "")? '0000-00-00' : req.body.Vence;

    let queryNombre = "SELECT IdEmpresa from Empresa where NombreEmpresa = '" + NombreCliente + "';";
    con.query(queryNombre, (error, result) => {
        if (error) return res.json("false");        
        let IdEmpresa = result[0]['IdEmpresa'];
        let query = "INSERT INTO Equipo (NumeroSerial, IdEmpresa, NumeroContrato, Planta, Ciudad, Fecha, Periodo, Vence, NombreResponsable, TelefonoResponsable, EmailResponsable, NombrePM, TelefonoPM, EmailPM, MLFB, TipoEquipo, Descripcion, CicloVida, FechaProduccion, AñosOperacion) values ('" + NumeroSerial + "', " + IdEmpresa + ", '" + NumeroContrato +"', '" + Planta + "', '" + Ciudad + "', '" + Fecha + "', '" + Periodo + "', '" + Vence + "', '" + NombreResponsable + "', '" + TelefonoResponsable + "', '" + EmailResponsable + "', '" + NombrePM + "', '" + TelefonoPM + "', '" + EmailPM + "', '" + MLFB +  "', " + TipoEquipo + ", '" + Descripcion + "', '" + CicloVida + "', '" + FechaProduccion + "', " + AñosOperacion + ")";
        console.log('Get equipment by serial:', resultado)
        con.query( query, (err, resultado) => {
            return res.json((err) ? "false" : "true");
        })
    })
})

// Update equipo
router.post("/updateEquipment/:serial", (req, res) => {
    let currentSerial = req.params.serial;

    let AñosOperacion = (req.body.AnnosOperacion == "")? 0: req.body.AnnosOperacion;
    let Ciudad = req.body.Ciudad;
    let Descripcion = req.body.Descripcion;
    let EmailPM = req.body.EmailPM;
    let EmailResponsable = req.body.EmailResponsable;
    let Fecha = (req.body.Fecha == "")? '0000-00-00': req.body.Fecha;
    let FechaProduccion = (req.body.FechaProduccion == "")? '0000-00-00': req.body.FechaProduccion;
    let MLFB = req.body.MLFB;
    let NombreCliente = req.body.NombreEmpresa;
    let NombrePM = req.body.NombrePM;
    let NumeroContrato = req.body.NumeroContrato;
    let NumeroSerial = req.body.NumeroSerial;
    let Periodo = req.body.Periodo;
    let Planta = req.body.Planta;
    let NombreResponsable = req.body.NombreResponsable;
    let TelefonoPM = req.body.TelefonoPM;
    let TelefonoResponsable = req.body.TelefonoResponsable;
    let TipoEquipo = req.body.TipoEquipo;
    let CicloVida = req.body.CicloVida;
    let Vence = (req.body.Vence == "")? '0000-00-00' : req.body.Vence;

    let queryNombre = "SELECT IdEmpresa from Empresa where NombreEmpresa = '" + NombreCliente + "';";
    console.log('Body:', req.body);
    
    con.query(queryNombre, (error, result) => {
        if (error) return res.json("false");
        console.log('IdEmpresa:', result[0]['IdEmpresa']);        
        let IdEmpresa = result[0]['IdEmpresa'];
        let query = "UPDATE Equipo SET AñosOperacion='" + AñosOperacion + "', Ciudad='" + Ciudad + "', Descripcion='" + Descripcion + "', EmailPM='" + EmailPM + "', EmailResponsable='" + EmailResponsable + "', Fecha='" + Fecha + "', FechaProduccion='" + FechaProduccion + "', MLFB='" + MLFB + "', IdEmpresa=" + IdEmpresa + ", NombrePM='" + NombrePM + "', NumeroContrato='" + NumeroContrato + "', NumeroSerial='" + NumeroSerial + "', Periodo='" + Periodo + "', Planta='" + Planta + "', NombreResponsable='" + NombreResponsable + "', TelefonoPM='" + TelefonoPM + "', TelefonoResponsable='" + TelefonoResponsable + "', TipoEquipo=" + TipoEquipo + ", CicloVida='" + CicloVida + "', Vence='" + Vence + "' WHERE NumeroSerial='" + currentSerial + "';";
        console.log('Query:', query);
        console.log('Get equipment by serial:', result)
        con.query( query, (err, resultado) => {
            return res.json((err) ? "false" : "true");
        })
    })
})


/**  -------------------- REPORTES --------------------------------------- */

router.get("/getReportByAssignment/:id", (req, res) => {
    let IdAsignacion = req.params.id;
    let query = "SELECT RG.Consecutivo, RG.FechaEnvio, RG.NombreContacto, RG.NombreColaborador, RG.NombreProyecto, RG.DescripcionAlcance, RG.Marca, RG.DenominacionInterna, RG.NumeroSerial, RG.CaracteristicasTecnicas, RG.EstadoInicial, RG.ActividadesRealizadas, RG.Conclusiones, RG.RepuestosSugeridos, RG.ActividadesPendientes, RG.HojaTiempo, RG.FirmaEmisor, RG.FirmaCliente, RG.Adjuntos, E.NombreEmpresa, T.CostoViaje, T.CostoServicio FROM ReporteGeneral AS RG INNER JOIN Empresa AS E ON RG.IdEmpresa=E.IdEmpresa INNER JOIN Asignacion ON RG.IdAsignacion=Asignacion.IdAsignacion INNER JOIN Especialista ON Asignacion.IdEspecialista=Especialista.IdEspecialista INNER JOIN Tecnica AS T ON Especialista.IdTecnica=T.IdTecnica WHERE RG.IdAsignacion=" + IdAsignacion + ";";

    con.query(query, (error, result) => {
        console.log(query)
        if (result.length == 0) {
            return res.json("false");
        } else {
            return res.json(result);
        }
    })
})

router.get("/getReportsFromEquipment/:serial", (req, res) => {
    let serial = req.params.serial;

    let query = "SELECT RG.Consecutivo, RG.FechaEnvio, RG.NombreContacto, RG.NombreColaborador, RG.NombreProyecto, RG.DescripcionAlcance, RG.Marca, RG.DenominacionInterna, RG.NumeroSerial, RG.CaracteristicasTecnicas, RG.EstadoInicial, RG.ActividadesRealizadas, RG.Conclusiones, RG.RepuestosSugeridos, RG.ActividadesPendientes, RG.HojaTiempo, RG.FirmaEmisor, RG.FirmaCliente, RG.Adjuntos, E.NombreEmpresa, T.CostoViaje, T.CostoServicio, Asignacion.PCFSV FROM ReporteGeneral AS RG INNER JOIN Empresa AS E ON RG.IdEmpresa=E.IdEmpresa INNER JOIN Asignacion ON RG.IdAsignacion=Asignacion.IdAsignacion INNER JOIN Especialista ON Asignacion.IdEspecialista=Especialista.IdEspecialista INNER JOIN Tecnica AS T ON Especialista.IdTecnica=T.IdTecnica WHERE RG.NumeroSerial='" + serial + "';";
    //let query = "SELECT * FROM reportegeneral WHERE NumeroSerial='" + serial + "';";
    con.query(query, (error, result) => {
        console.log( result)
        return res.json(result);
    })
})


module.exports = {
    router,
    startingMysql
};