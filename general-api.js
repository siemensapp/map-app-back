const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const variables = require('./auxiliar/variables');
const jwt = require('jsonwebtoken');
const auxImage = require('./auxiliar/imageFunctions');
const auxCertificadoA = require('./auxiliar/imageFunctions');
const auxVacunas = require('./auxiliar/imageFunctions');
const auxTprofesional = require('./auxiliar/imageFunctions');
const auxCertificadoMD = require('./auxiliar/imageFunctions');
const auxConte = require('./auxiliar/imageFunctions');
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
        //password: 'admin@SiemensDB123',
        password: 'admin',
        insecureAuth: true,
        port: 3306
    });

    con.connect((err) => {
        if (err) {
            console.log("Not connected to Mysql, Retrying ...");
            console.log(err);
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
    //console.log(fakeDatabase);

});

// Endpoint donde se subscriben a las notificaciones push los usuarios de la aplicacion
router.post('/subscriptionDesktop', (req, res) => {
    let subscription = req.body;
    let query = "UPDATE usuariodesktop SET subscriptionToken='" + JSON.stringify(subscription) + "' WHERE "
    fakeDatabase['Desktop'] = subscription;
    res.status(200).json("Subscripcion recibida");
    //console.log(fakeDatabase);
});

// Registrar un nuevo usuario de Desktop, SOLO PARA PRUEBAS Y USO DE BCRYPT
router.post('/registerDesktop', (req, res, err) => {
    let name = req.body.name;
    let email = req.body.email;
    let hashedPassword = bcrypt.hashSync(req.body.password, 8);
    let query = "INSERT INTO usuariodesktop (name, email, password) values('" + name + "','" + email + "','" + hashedPassword + "');";
    //console.log(query);
    con.query(query, (error, result) => {
        if (error) return res.json("Error en la base de datos");
        else {
            res.json("true");
        }
    })
})

// Registrar un nuevo usuario de App, SOLO PARA PRUEBAS Y USO DE BCRYPT
//se revisa que no hayan duplicados de idespecialista
router.post('/registerApp', (req, res, err) => {
    let CedulaCiudadania = req.body.cedula;
    let IdEspecialista = req.body.CedulaCiudadania;
    let hashedPassword = bcrypt.hashSync(req.body.password, 8);
    var queryDuplicado = "SELECT CedulaCiudadania FROM especialista WHERE IdEspecialista="+IdEspecialista+";";
    con.query(queryDuplicado, (error, result) => {
        if(error){
            //console.log("Error consultando duplicado ID");
        }else{
            //console.log("Consulta hecha duplicado");
            if(result.length == 0){
                //res.json("true");
                //console.log("No hay duplicado ID");
                let query = "INSERT INTO usuarioapp (CedulaCiudadania, password) values('" + CedulaCiudadania + "','" + hashedPassword + "');";
                //console.log(query);
                con.query(query, (error, result) => {
                    if (error){
                        //console.log("Error en la base de datos");
                    } else {
                         res.json("true");
                    }
                })
            }else{
                //console.log("El ID es duplicado");
                res.json("duplicated");
            }
        }
    })
    
    
})

// El usuario se logea a traves de este endpoint
router.post('/loginApp', (req, res, err) => {
    let query = "SELECT * FROM usuarioapp WHERE CedulaCiudadania='" + req.body.user + "';";
    con.query(query, (err, result) => {
        if (result.length == 0) return res.json("Usuario no encontrado");
        let comparePassword = bcrypt.compareSync(req.body.password, result[0].password);
        if (!comparePassword) return res.json("Contraseña incorrecta");
        let token = jwt.sign({
            email: result.password
        }, variables.secret, {
            expiresIn: 86400
        })
        let userDataQuery = "SELECT NombreE, Foto from especialista Where CedulaCiudadania='" + req.body.user + "';";
        con.query(userDataQuery, (err, result) => {
            //console.log(result);
            if(result[0] == undefined || err){
                res.json("No esta registrado");
                //console.log("ERROR AL TRAER ESPECIALISTA");
            }else{
            return res.send({
                auth: true,
                token: token,
                expiresIn: 86400,
                NombreE: result[0]['NombreE'],
                NombreColaborador: result[0]['NombreE'],//colaborador = especialista
                Foto: auxImage.convertBase64(result[0]['Foto'])
                })
            }
        })
    })
})

//

router.post('/loginDesktop', (req, res, err) => {
    let query = "SELECT * FROM usuariodesktop WHERE email='" + req.body.user + "@siemens.com';";
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
        //     //console.log(result);

        // })
    })
})

// Trae datos de trabajadores en servicio para poner los puntos en el mapa
router.get("/workers/:date", (req, res, err) => {
    //console.log("Connected to get")
    let fecha = req.params.date;
    let workersQuery, query = "SELECT especialista.NombreE, asignacion.CoordenadasEspecialista from asignacion inner join especialista on especialista.idespecialista = asignacion.idespecialista where idstatus=1 and '"+fecha+"' between fechainicio and fechafin";
    //console.log(query);
    con.query(query, (error, result, fields) => {
            if (error) throw error;
            workersQuery = result;
            res.json(workersQuery);
        })
        //console.log("Done with get")
});

// Endpoint para probar el middleware del token
router.get('/test', verifyToken, (req, res) => {
    res.json("Prueba exitosa");
})

// Trae datos para llenar opciones del componente de asignacion
router.get("/allWorkers", (req, res, err) => {
    //console.log("Connected to get")
    var workersQuery;
    con.query("select especialista.NombreE, especialista.IdEspecialista, especialista.IdTecnica, tecnica.NombreT, tecnica.IdTecnica from especialista inner join tecnica on especialista.IdTecnica = tecnica.IdTecnica ORDER BY tecnica.IdTecnica;", (error, result, fields) => {
        if (error){
            res.json("false");
            throw error;
        }else{
            workersQuery = result;
            res.json(workersQuery)
        }
        ;
    })
});

// Trae los detalles de los trabajadores a la lista de usuarios, se prepara para la edicion.
router.get("/workersList/:date", (req, res, err) => {
    //console.log("Connected to get all List")
    var workersQuery;
    let fecha = req.params.date;
    //let query = "SELECT Especialista.NombreE, Especialista.Celular, Especialista.FechaNacimiento, Especialista.CeCo, Especialista.Foto, Especialista.IdEspecialista, Especialista.GID, Especialista.CedulaCiudadania, Especialista.LugarExpedicion, Especialista.TarjetaIngresoArgos, Especialista.IdTecnica, Tecnica.NombreT,  Asignacion.IdAsignacion, Status.NombreS from Especialista inner join Tecnica on Especialista.IdTecnica=Tecnica.IdTecnica inner join Asignacion on Especialista.IdEspecialista = Asignacion.IdEspecialista inner join status on Asignacion.IdStatus=Status.IdStatus WHERE '" + fecha + "' BETWEEN Asignacion.FechaInicio AND Asignacion.FechaFin";
    let query2 = "SELECT especialista.fechaVA, especialista.fechavm, especialista.NombreE, especialista.Celular, especialista.FechaNacimiento, especialista.CeCo, especialista.Foto, especialista.IdEspecialista as id, especialista.GID, especialista.CedulaCiudadania, especialista.LugarExpedicion, especialista.TarjetaIngresoArgos, especialista.IdTecnica, tecnica.NombreT, especialista.email, IFNULL((SELECT status.NombreS FROM status INNER JOIN asignacion ON status.IdStatus=asignacion.IdStatus WHERE IdEspecialista=id AND '"+fecha+"' BETWEEN FechaInicio AND FechaFin), 'Disponible') as Estado, IFNULL((SELECT asignacion.IdAsignacion FROM asignacion WHERE IdEspecialista=id AND '"+fecha+"' BETWEEN FechaInicio AND FechaFin), null) as Asignacion FROM especialista INNER JOIN tecnica ON especialista.IdTecnica=tecnica.IdTecnica;";
    con.query(query2, (error, result) => {
        if (error) throw error;
        workersQuery = result;
        //console.log("RESULT *************");
        //console.log(result);
        for (let worker of workersQuery) {
            worker["FotoBase64"] = auxImage.convertBase64(worker);
        }
        return res.json(workersQuery);
    })
});

//TRAER LOS DATOS DE LAS EMPRESAS AL COMBOBOX DE CREAR ASIGNACION
router.get("/clientList", (req, res, err) => {
    let query = "SELECT * FROM empresa";
    con.query(query, (error, result, fields) => {
        if (error) return res.json("Hubo un error al traer las empresas");
        return res.json(result);
    })
});


//añade un nuevo cliente
router.post("/addCliente", (req, res, err) => {
    let queryDuplicado = "SELECT * FROM empresa WHERE NombreEmpresa='"+req.body.NombreEmpresa+"';";
    let promesaDuplicado = new Promise((resolve, reject) => {
        con.query(queryDuplicado,(error, result) => {
            if(error){
                console.log("error al buscar duplicado");
                res.json("false");
                reject();
            }else{
                resolve(result);
            }
        })
    })

    promesaDuplicado.then((result) => {
        if(result.length != 0){
            res.json("duplicated");
        }else{
            let queryAdd = "INSERT INTO empresa (NombreEmpresa) VALUES ('"+req.body.NombreEmpresa+"');";
            con.query(queryAdd, (error, result) => {
                if(error){
                    console,log("error al insertar empresa");
                    res.json("false");
                }else{
                    console.log("empresa registrada");
                    res.json("true");
                }
            })
        }
    })
})


// Crea asignacion 
router.post("/setAssignment", (req, res, err) => {
    let data = req.body;
    let IdEspecialista = data.IdEspecialista;
    let FechaInicio = data.FechaInicio;
    let FechaFin = data.FechaFin;
    let checkQuery = "SELECT * FROM asignacion WHERE IdEspecialista = " + IdEspecialista + " AND ('" + FechaInicio + "' BETWEEN FechaInicio AND FechaFin OR '" + FechaFin + "' BETWEEN FechaInicio AND FechaFin)";
    
    con.query(checkQuery, (error, result) => {
        if (error) return res.json("false checkquery");
        if (result.length !== 0) return res.json("existe");
        //console.log("PRIMER QUERY ASIGMENT");
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
        else if(PCFSV == 'E'){tipoServicio = 'Emergencia'}
        else if(PCFSV == 'CN'){tipoServicio = 'Correctivo No Planeado'}
        else{tipoServicio = 'OTRO'}

        let query1 = "SELECT IdEmpresa FROM empresa WHERE NombreEmpresa='" + NombreCliente + "';";
        con.query(query1, (error, result) => {
            //console.log(query1);
            if (error){
                //console.log("ERROR");
            }else{
                //console.log("SEGUNDO QUERY ASSIGNMENT");
                IdEmpresa = result[0]['IdEmpresa'];
                let insertQuery = "INSERT INTO asignacion (PCFSV, IdEspecialista, IdStatus, StatusAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, TiempoInicio, TiempoFinal, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion) VALUES('" + PCFSV + "', " + IdEspecialista + "," + IdStatus + ", 0, " + IdEmpresa + ", '" + NombrePlanta + "', '" + CiudadPlanta + "', '" + FechaInicio + "', '" + FechaFin + "', null, null, '" + CoordenadasSitio + "', '', '" + NombreSitio + "', '" + NombreContacto + "', '" + TelefonoContacto + "', '" + EmailContacto + "', '" + Descripcion + "')";
                con.query(insertQuery, (error, result) => {
                    //console.log("TERCER QUERY ASSIGNMENT");
                    //console.log(error);
                    // auxPush.notifNewAssignment(fakeDatabase['App'], 'newAssignment');
                    if(error){
                        res.json("false")
                    }else{
                        res.json("true");
                    }
                });
            }
            
        });
    });
});

//para enviar email al administrador para informar que se vencio un certificado
router.post("/sendMailCertification", (req, res, err) => {
    let data = req.body;
    var count;
    var contador;
    var trabajadores;
    var cadena;
    var administradores;
    var Ealturas0='',Ealturas15='',Emanejo0='',Emanejo15='',destinatarios='';
    var MensajeA0='',MensajeA15='', MensajeM0='',MensajeM15='';


    let promesaUno = new Promise((resolve, reject) => {
    var queryMailAdmin = "SELECT email FROM usuariodesktop"+";";
    con.query(queryMailAdmin, (error, result) => {
        if(error){
            res.json("false");
            reject();
        }else{
            //console.log(result);
            administradores = JSON.stringify(result);
            administradores = JSON.parse(administradores);
            res.json("true");
            resolve(result);

        }

    })

    });

    promesaUno.then((result) => {
    let promesaDos = new Promise ((resolve,reject)=>{

        var queryVerifiacion = "Select NombreE,ConfirmacionA0,ConfirmacionA15,ConfirmacionM0,ConfirmacionM15 from especialista"+";";
        con.query(queryVerifiacion,(error4,result4) => {
            var i, j,k;
            var contCM0=0,contCM15=0;contCA0=0;contCA15=0;
            if(error4){
                reject();
            }
            else{
                resolve(result4);
                //console.log(result4);
                trabajadores = JSON.stringify(result4);
                trabajadores = JSON.parse(trabajadores);
                contador = Object.keys (trabajadores).length;
                count = Object.keys(administradores).length;
                cadena = Object.keys(data).length;
                console.log(cadena);
                for(i=0;i<contador;i++){
    
                    for(j=0;j<cadena;j++){
    
                        if (data[j]['nombre']==trabajadores[i]['NombreE']&&data[j]['Tipo']=='Alturas'&&data[j]['dias']==0&&trabajadores[i]['ConfirmacionA0']==0){
    
                            Ealturas0=Ealturas0+"'"+trabajadores[i]['NombreE']+"'"+',';
                            contCA0=contCA0+1;
                            
                        }
                        if (data[j]['nombre']==trabajadores[i]['NombreE']&&data[j]['Tipo']=='Alturas'&&data[j]['dias']==15&&trabajadores[i]['ConfirmacionA15']==0){
    
                            Ealturas15=Ealturas15+"'"+trabajadores[i]['NombreE']+"'"+',';
                            contCA15=contCA15+1;
                            
                        }
                        if (data[j]['nombre']==trabajadores[i]['NombreE']&&data[j]['Tipo']=='Manejo'&&data[j]['dias']==0&&trabajadores[i]['ConfirmacionM0']==0){
    
                            Emanejo0=Emanejo0+"'"+trabajadores[i]['NombreE']+"'"+',';
                            contCM0=contCM0+1;
                            
                        }
                        if (data[j]['nombre']==trabajadores[i]['NombreE']&&data[j]['Tipo']=='Manejo'&&data[j]['dias']==15&&trabajadores[i]['ConfirmacionM15']==0){
    
                            Emanejo15=Emanejo15+"'"+trabajadores[i]['NombreE']+"'"+',';
                            contCM15=contCM15+1;
                        }
    
                    }
    
                    if (contCA0>0){
    
                        MensajeA0="<p>El certificado de Alturas de "+Ealturas0+" vence en 0 días.</p>"+"<br>";
                    }
                    if (contCA15>0){
    
                        MensajeA15="<p>El certificado de Alturas de "+Ealturas15+" vence en 15 días.</p>"+"<br>";
                    }
                    if (contCM0>0){
    
                        MensajeM0="<p>El certificado de Manejo defensivo de "+Emanejo0+" vence en 0 días.</p>"+"<br>";
                    }
                    if (contCM15>0){
    
                        MensajeM15="<p>El certificado de Manejo defensivo de "+Emanejo15+" vence en 15 días.</p>"+"<br>";
                    }
    
    
    
                }
    
                for (k=0;k<count;k++){
                    destinatarios=destinatarios+administradores[k]['email']+',';
                }
                console.log(Ealturas0.slice(0,-1));
                console.log(Ealturas15);
                console.log(Emanejo0);
                console.log(Emanejo15);
                
    
    
            }
        })


        
    })

    promesaDos.then(()=>{

        let promesaTres = new Promise ((resolve,reject)=>{
        if(Ealturas0!=''){
        var queryActualizarA0 = "UPDATE especialista SET ConfirmacionA0 = 1 WHERE NombreE IN "+"("+Ealturas0.slice(0,-1)+")"+";";
        console.log(queryActualizarA0);
        con.query(queryActualizarA0, (error, result8) => {
            if(error){
                console.log(error);
                console.log('Error en el query *******************************');
                reject();
            }else{
                resolve(result8);
                console.log('lo hice **************************************Actualice');
    
            }
    
        })
    }
    else{
        console.log("lista vacia");
    }
    })

    promesaTres.then(()=>{
    })



    }).then(()=>{

        if(Ealturas15!=''){
            var queryActualizarA15 = "UPDATE especialista SET ConfirmacionA15 = 1 WHERE NombreE IN "+"("+Ealturas15.slice(0,-1)+")"+";";
            console.log(queryActualizarA15);
            con.query(queryActualizarA15, (error, result8) => {
                if(error){
                    console.log(error);
                    console.log('Error en el query *******************************');
                }else{
                    console.log('lo hice **************************************Actualice');
        
                }
        
            })
        }
        else{
            console.log("lista vacia");
        }
    }).then(()=>{

        console.log("SIGUIENTE 1*********************************")
        if(Emanejo0!=''){
            var queryActualizarM0 = "UPDATE especialista SET ConfirmacionM0 = 1 WHERE NombreE IN "+"("+Emanejo0.slice(0,-1)+")"+";";
            console.log(queryActualizarM0);
            con.query(queryActualizarM0, (error, result8) => {
                if(error){
                    console.log(error);
                    console.log('Error en el query *******************************');
                }else{
                    console.log('lo hice **************************************Actualice');
        
                }
        
            })
        }
        else{
            console.log("lista vacia");
        }
    }).then(()=>{

        console.log("SIGUIENTE 2*********************************")
        if(Emanejo15!=''){
            var queryActualizarM15 = "UPDATE especialista SET ConfirmacionM15 = 1 WHERE NombreE IN "+"("+Emanejo15.slice(0,-1)+")"+";";
            console.log(queryActualizarM15);
            con.query(queryActualizarM15, (error, result8) => {
                if(error){
                    console.log(error);
                    console.log('Error en el query *******************************');
                }else{
                    console.log('lo hice **************************************Actualice');
        
                }
        
            })
        }
        else{
            console.log("lista vacia");
        }
    }).then(()=>{
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
            from:"'Vencimiento certificados' <asignacionsiemens@gmail.com>",
            to: destinatarios,
            subject: "Vencimiento certificados",
            text:"Se han vencido los certificados",
            html:
                "<h2>Vencimiento Certificaos</h2>"+
                MensajeA0+
                MensajeA15+
                MensajeM0+
                MensajeM15+
                "<p>Por favor recuerde actualizar los certificados y su fecha de vencimiento</p>"
                
        }

        if(Ealturas0!=''||Ealturas15!=''||Emanejo0!=''||Emanejo15!=''){
            console.log("*************ENTRE A ENVAR CORREOS******************")
            transporter.sendMail(HelperOptions, function(err,res){
                if (err){
                    console.log(err);
                    console.log("No se envio**********");
                }else{
                    console.log("Si se envio");
                }
            });
        }


    })
    
    })
  //Ultimo  
  })


//endpoint para enviar email al especialista cuando se le asigna un trabajo
router.post("/sendMail", (req,res,err) => {
    let data = req.body;
    let IdEspecialista = data.IdEspecialista;
    let FechaInicio = data.FechaInicio;
    let FechaFin = data.FechaFin;
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
    let tipoServicio;

    if(PCFSV == 'P'){tipoServicio = 'Preventivo planeado'}
    else if(PCFSV == 'C'){tipoServicio = 'Correctivo planeado'}
    else if(PCFSV == 'F'){tipoServicio = 'Pruebas FAT'}
    else if(PCFSV == 'S'){tipoServicio = 'Puesta en servicio'}
    else if(PCFSV == 'V'){tipoServicio = 'Soporte ventas'}
    else{tipoServicio = 'OTRO'}
    
    let query1 = "SELECT IdEmpresa FROM empresa WHERE NombreEmpresa='" + NombreCliente + "';";
    con.query(query1, (error, result) => {
        IdEmpresa = result[0]['IdEmpresa'];
        if(error){
            res.json("error");
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
            let queryEmail = "SELECT email FROM especialista WHERE IdEspecialista="+IdEspecialista+";";
            con.query(queryEmail, (error3, result3) => {
                let emailEspecialista = result3[0]['email'];
                if(error3){
                    //console.log("ERROR EN EMAIL");
                }else{
                    let HelperOptions={
                        from:"'Asignación Siemens' <asignacionsiemens@gmail.com",
                        to: emailEspecialista,
                        subject: "Nueva asignación Field Service Siemens",
                        text:"Tiene una nueva asignación desde SISTEMA PARA GESTION DE FIELD SERVICE: ",
                        html: 
                              "<h2>Asignación</h2>"+
                              "<p>Usted ha recibido una asignación de trabajo field service, a continuación podrá ver la información al respecto:  </p>"+
                              '<table style="width:100%; border: 1px solid black;border-collapse: collapse;">'+
                                    "<tr>"+
                                        "<th style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>CAMPO</th>"+
                                        "<th style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>INFORMACION</th>"+
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
                            //console.log(err);
                            //console.log("No se envio**********");
                        }else{
                            //console.log("Si se envio");
                        }
                    });
                    res.json("true");
                }
                
            });
        }
    });
});

//endpoint para enviar un correo al especialista al editar una asignacion
router.post("/sendMailEdit/", (req, res, err) => {
    let data = req.body;
    let IdEspecialista = data.IdEspecialista;
    let IdStatus = data.IdStatus;
    let IdAsignacion = data.IdAsignacion;
    let PCFSV = data.PCFSV;
    let IdEmpresa = data.IdEmpresa;
    let NombrePlanta = data.NombrePlanta;
    let CiudadPlanta = data.CiudadPlanta;
    let StatusAsignacion = data.StatusAsignacion;
    let FechaInicio = data.FechaInicio;
    let FechaFin = data.FechaFin;
    let NombreSitio = data.NombreSitio;
    let NombreContacto = data.NombreContacto;
    let TelefonoContacto = data.TelefonoContacto;
    let EmailContacto = data.EmailContacto;
    let Descripcion = data.Descripcion;
    let emailEspecialista;
    let tipoServicio;
    let NombreEmpresa;
    let Asignacion;

    if(Descripcion == ""){
        Descripcion = "Ninguna";
    }

    switch(StatusAsignacion){
        case '1':
            Asignacion = "En Servicio";
        break;
        case '2':
            Asignacion = "Compensatorio";
        break;
        case '3':
            Asignacion = "Vacaciones";
        break;
        case '4':
            Asignacion = "Disponible";
        break;
        case '5':
            Asignacion = "Incapacidad";
        break;
        case '6':
            Asignacion = "Permiso";
        break;
        case '7':
            Asignacion = "Capacitacion";
        break;
        case '8':
            Asignacion = "Disponible fin de semana";
        break;
    }

    if(PCFSV == 'P'){tipoServicio = 'Preventivo planeado'}
    else if(PCFSV == 'C'){tipoServicio = 'Correctivo planeado'}
    else if(PCFSV == 'F'){tipoServicio = 'Pruebas FAT'}
    else if(PCFSV == 'S'){tipoServicio = 'Puesta en servicio'}
    else if(PCFSV == 'V'){tipoServicio = 'Soporte ventas'}
    else{tipoServicio = 'OTRO'}
    
    var queryMailEspecialista = "SELECT email FROM especialista WHERE IdEspecialista="+IdEspecialista+";";
    var queryNombreEmpresa = "SELECT NombreEmpresa FROM empresa WHERE IdEmpresa="+IdEmpresa+";";
    con.query(queryMailEspecialista, (error, result) => {
        if(error){
            console.log("error en query");
            res.json("false");
        }else{
            emailEspecialista = result[0]['email'];
            /* Obtiene el email del especialista, envia el correo*/
            con.query(queryNombreEmpresa, (error, result) => {
                if(error){
                    console.log("error en query 2");
                    res.json("false");
                }else{
                    NombreEmpresa = result[0]['NombreEmpresa'];
                    
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
                        from:"'Asignación Modificada Siemens' <asignacionsiemens@gmail.com",
                        to: emailEspecialista,
                        subject: "Asignación Modificada Field Service Siemens",
                        text:"Se ha modificado una asignación en la que usted aparece como especialista seleccionado : ",
                        html: 
                            "<h2>Asignación</h2>"+
                            "<p>Una asignación dada a usted ha sido modificada, a continuación podrá ver la información al respecto:  </p>"+
                            '<table style="width:100%; border: 1px solid black;border-collapse: collapse;">'+
                                    "<tr>"+
                                        "<th style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>CAMPO</th>"+
                                        "<th style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>INFORMACION</th>"+
                                    "</tr>"+
                                    "<tr>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Nombre del cliente</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+NombreEmpresa+"</td>"+
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
                                        "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Status asignacion</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+Asignacion+"</td>"+
                                     "</tr>"+
                                     "</tr>"+
                                        "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Fecha de Inicio</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+FechaInicio+"</td>"+
                                     "</tr>"+
                                     "</tr>"+
                                        "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Fecha de Finalizacion</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+FechaFin+"</td>"+
                                     "</tr>"+
                                     "</tr>"+
                                        "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Nombre del sitio</td>"+
                                        "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+NombreSitio+"</td>"+
                                     "</tr>"+
                                     
                                "</table>"+
                                "<br>"+
                                "<p>Puede consultar la asignacion completa en el aplicativo Movil con su cuenta</p>"
                    }
                        transporter.sendMail(HelperOptions, function(err,res){
                            if (err){
                                console.log("error sen mail");
                                //console.log(err);
                                //console.log("No se envio**********");
                            }else{
                                //console.log("Si se envio");
                            }
                        });
                    res.json("true");
                }
            })
        }
    })
})

//para enviar email al especialista y notificarle de que ha sido borrada su asignacion
router.post("/sendMailDelete", (req, res, err) => {
    let data = req.body;
    let IdEspecialista = data.IdEspecialista;
    let IdStatus = data.IdStatus;
    let IdEmpresa = data.IdEmpresa;
    let PCFSV = data.PCFSV;
    let IdAsignacion = data.IdAsignacion;
    let NombreCliente = data.NombreEmpresa;
    let NombrePlanta = data.NombrePlanta;
    let CiudadPlanta = data.CiudadPlanta;
    let fecha = data.fecha;
    let Desde = data.desde;
    let Hasta = data.Hasta;
    let FechaInicio = data.fechaInicio;
    let FechaFin = data.FechaFin;
    let NombreSitio = data.NombreSitio;
    let NombreContacto = data.NombreContacto;
    let TelefonoContacto = data.TelefonoContacto;
    let Descripcion = data.Descripcion;
    let EmailContacto = data.EmailContacto;
    let SujetoCancelacion = data.SujetoCancelacion;
    let RazonCancelacion = data.RazonCancelacion;
    let tipoServicio;
    let emailEspecialista;

    if(Descripcion == ""){Descripcion = "Ninguna";}

    if(PCFSV == 'P'){tipoServicio = 'Preventivo planeado'}
    else if(PCFSV == 'C'){tipoServicio = 'Correctivo planeado'}
    else if(PCFSV == 'F'){tipoServicio = 'Pruebas FAT'}
    else if(PCFSV == 'S'){tipoServicio = 'Puesta en servicio'}
    else if(PCFSV == 'V'){tipoServicio = 'Soporte ventas'}
    else{tipoServicio = 'OTRO'}

    
    var queryMailEspecialista = "SELECT email FROM especialista WHERE IdEspecialista="+IdEspecialista+";";
    
    con.query(queryMailEspecialista, (error, result) => {
        if(error){
            res.json("false");
        }else{
            res.json("true");
            emailEspecialista = result[0]['email'];
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
                from:"'Eliminada Asignación Siemens' <asignacionsiemens@gmail.com",
                to: emailEspecialista,
                subject: "Asignación Eliminada Field Service Siemens",
                text:"Se ha eliminado/cancelado una asignación en la que usted aparece como especialista seleccionado : ",
                html: 
                    "<h2>Asignación</h2>"+
                    "<p>Una asignación dada a usted ha sido eliminada, a continuación podrá ver la información al respecto:  </p>"+
                    '<table style="width:100%; border: 1px solid black;border-collapse: collapse;">'+
                            "<tr>"+
                                "<th style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>CAMPO</th>"+
                                "<th style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>INFORMACION</th>"+
                            "</tr>"+
                            "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Nombre Cliente</td>"+
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
                            "</tr>"+
                            "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Nombre Sitio</td>"+
                                "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+NombreSitio+"</td>"+
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
                                "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Sujeto de cancelacion asignacion</td>"+
                                "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+SujetoCancelacion+"</td>"+
                             "</tr>"+
                             "</tr>"+
                                "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Razon de cancelacion asignacion</td>"+
                                "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+RazonCancelacion+"</td>"+
                             "</tr>"+
                             "</tr>"+
                                "<tr style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+
                                "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>Fecha cancelacion asignacion</td>"+
                                "<td style='border: 1px solid black;border-collapse: collapse;padding: 5px;text-align: left;'>"+fecha+"</td>"+
                             "</tr>"+
                             
                        "</table>"+
                        "<br>"+
                        "<p>Puede consultar la asignacion completa en el aplicativo Movil con su cuenta</p>"
            }
                transporter.sendMail(HelperOptions, function(err,res){
                    if (err){
                        //console.log(err);
                        //console.log("No se envio**********");
                    }else{
                        //console.log("Si se envio");
                    }
                });
        }
    })
})

// Borra usuario dado un id y tambien sus asignaciones
//modificado para borrar por nombre y no por id, workerId = NombreE
router.get("/deleteWorker/:workerId", (req, res, err) => {
    //console.log("Entered delete");
    con.query("delete from especialista Where NombreE='" + req.params.workerId + "';", (error, result, fields) => {
       // //console.log("---------------");
        ////console.log(req.params.workerId);
        ////console.log("---------------");
        res.json((error) ? "false" : "true")
        //console.log(error);
    })
});


//Borra un usuarioApp por la cedula
router.get("/deleteUserApp/:CedulaCiudadania", (req, res, err) => {
    //console.log("Deleting user app start");
    //console.log(req.params.CedulaCiudadania);
    con.query("DELETE FROM usuarioapp WHERE CedulaCiudadania='"+req.params.CedulaCiudadania+"';", (error, result, fields) => {
        if(error){
            res.json("false");
            //console.log("Error al eliminar user app");
        }else{
            res.json("true");
            //console.log("User app eliminado");
        }
    })
});

//Para obtener los datos de tecnica, tarifas de costos etc
router.get("/getTarifas/", (req, res, err) => {
    let query = "SELECT * FROM tecnica;";
    con.query(query, (error, result) => {
        if(error){
            res.json("false");
        }else{
            res.json(result);
        }
    })
});


//Modificar tarifas de servicios
//modifica de acuerdo si solo se modifica costo vaije, solo costo servicio o los dos
router.post("/editTarifas/", (req, res, err) => {
    let data = req.body;
    let NombreT = data.NombreT;
    let CostoServicio = data.CostoServicio;
    let CostoViaje = data.CostoViaje;
    console.log("NombreT",NombreT);
    console.log("CostoServicio", CostoServicio);
    console.log("CostoViaje", CostoViaje);
    let query;
    if(CostoServicio == ""){
        query = "UPDATE tecnica SET CostoViaje="+CostoViaje+" WHERE NombreT='"+NombreT+"';";
        con.query(query, (error, result) => {
            if(error){
                res.json("false");
            }else{
                res.json("true");
            }
        })
    }else if(CostoViaje == ""){
        query = "UPDATE tecnica SET CostoServicio="+CostoServicio+" WHERE NombreT='"+NombreT+"';";
        con.query(query, (error, result) => {
            if(error){
                res.json("false");
            }else{
                res.json("true");
            }
        })
    }else if(CostoServicio != "" && CostoViaje != ""){
        query = "UPDATE tecnica SET CostoViaje="+CostoViaje+" ,CostoServicio="+CostoServicio+" WHERE NombreT='"+NombreT+"';";
        con.query(query, (error, result) => {
            if(error){
                res.json("false");
            }else{
                res.json("true");
            }
        })
    }
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
    let FechaVA;
    let fechaVM;
    let email = data.email;
    let CeCo = data.CeCo;
    let GID = data.GID;
    let CedulaCiudadania = data.CedulaCiudadania;
    let LugarExpedicion = data.LugarExpedicion;
    let TarjetaIngresoArgos = data.TarjetaIngresoArgos;
    // Image route
    let base64String, base64Image, imagePath;
    //CertificadoA route
    let base64StringA, base64Certificado, certificadoPath;
    //CertificadoMD route
    let base64StringMD, base64CertificadoMD, certificadoPathMD;
    //Vacunas route
    let base64StringV, base64V, VacunasPath;
    //Tprofesional route
    let base64StringT, base64T, TprofesionalPath;
    //Conte route
    let base64StringC, base64C, ContePath;
    

    var queryDuplicado = "SELECT CedulaCiudadania FROM especialista WHERE IdEspecialista="+IdEspecialista+";";
    con.query(queryDuplicado, (error, result) => {
        if(error){
            console.log("Error consultando duplicado ID");
        }else{
            console.log("Consulta hecha duplicado");
            if(result.length == 0){
                res.json("true");
                console.log("No hay duplicado ID");
                var query = "INSERT INTO especialista(IdEspecialista, CeCo, NombreE, TarjetaIngresoArgos, Celular, GID, CedulaCiudadania, LugarExpedicion, FechaNacimiento, IdTecnica, email) VALUES(" + IdEspecialista + ",'" + CeCo + "','" + NombreE + "','" + TarjetaIngresoArgos + "','" + Celular + "','" + GID + "','" + CedulaCiudadania + "','" + LugarExpedicion + "','" + FechaNacimiento + "'," + IdTecnica+ ","+email+")";
                
                //Crea el archivo de vacunas si el campo vacunas tiene un archivo
                if(data.Vacunas){
                    base64StringV= data.Vacunas;
                    base64V=base64StringV.split(';base64,').pop();
                    VacunasPath = variables.serverDirectoryWin + 'images/Vacunas_' + data.IdEspecialista + ".pdf";
                }else{
                    VacunasPath = variables.serverDirectoryWin + "images/Vacio.pdf";
                }
                //Crea el archivo de Conte si el campo Conte tiene un archivo
                if(data.Vacunas){
                    base64StringC= data.Conte;
                    base64C=base64StringC.split(';base64,').pop();
                    ContePath = variables.serverDirectoryWin + 'images/Conte_' + data.IdEspecialista + ".pdf";
                }else{
                    ContePath = variables.serverDirectoryWin + "images/Vacio.pdf";
                }
                //Crea el archivo de Tprofesional si el campo Tprofesional tiene un archivo
                if(data.Tprofesional){
                    base64StringT= data.Tprofesional;
                    base64T=base64StringT.split(';base64,').pop();
                    TprofesionalPath = variables.serverDirectoryWin + 'images/TarjetaProfesional_' + data.IdEspecialista + ".pdf";
                }
                else{
                    TprofesionalPath = variables.serverDirectoryWin + "images/Vacio.pdf";
                }
                //Crea el archivo certificado de alturas si el campo certificado de alturas tiene un archivo
                if(data.CertificadodeAlturas){
                    FechaVA=data.FechaVA;
                    base64StringA=data.CertificadodeAlturas;
                    base64Certificado = base64StringA.split(';base64,').pop();
                    certificadoPath = variables.serverDirectoryWin + 'images/certificadoA_' + data.IdEspecialista + ".pdf";
                }else{
                    certificadoPath = variables.serverDirectoryWin + "images/Vacio.pdf";
                    FechaVA='1000-01-01';
                }
                //Crea el archivo certificado de manejo defensivo si el campo certificado de manejo defensivo tiene un archivo
                if(data.CertificadoMD){
                    fechaVM = data.FechaVM;
                    base64StringMD= data.CertificadoMD;
                    base64CertificadoMD = base64StringMD.split(';base64,').pop();
                    certificadoPathMD = variables.serverDirectoryWin + 'images/certificadoMD_' + data.IdEspecialista + ".pdf";
                }else{
                    certificadoPathMD = variables.serverDirectoryWin + "images/Vacio.pdf";
                    fechaVM= '1000-01-01';
                }
                if (data.Foto) {
                    base64String = data.Foto;                   
                    base64Image = base64String.split(';base64,').pop();               
                    imagePath = variables.serverDirectoryWin + 'images/Foto_' + data.IdEspecialista + ".jpg";
                    query = "INSERT INTO especialista(IdEspecialista, CeCo, NombreE, TarjetaIngresoArgos, Celular, GID, CedulaCiudadania, LugarExpedicion, FechaNacimiento, IdTecnica, Foto,certificadoAlturas,certificadomd,vacunas,fechaVA,Tprofesional,fechavm,conte, email) VALUES(" + IdEspecialista + ",'" + CeCo + "','" + NombreE + "','" + TarjetaIngresoArgos + "','" + Celular + "','" + GID + "','" + CedulaCiudadania + "','" + LugarExpedicion + "','" + FechaNacimiento + "'," + IdTecnica + ",'" + imagePath+ "','" + certificadoPath+ "','" + certificadoPathMD+ "','" + VacunasPath+ "','" + FechaVA+ "','" + TprofesionalPath+ "','" + fechaVM+ "','" + ContePath+ "','"+email+"');";
                }else{
                    imagePath = variables.serverDirectoryWin + "images/default-user.png";
                    query = "INSERT INTO especialista(IdEspecialista, CeCo, NombreE, TarjetaIngresoArgos, Celular, GID, CedulaCiudadania, LugarExpedicion, FechaNacimiento, IdTecnica, Foto,certificadoAlturas,certificadomd,vacunas,fechaVA,Tprofesional,fechavm,conte, email) VALUES(" + IdEspecialista + ",'" + CeCo + "','" + NombreE + "','" + TarjetaIngresoArgos + "','" + Celular + "','" + GID + "','" + CedulaCiudadania + "','" + LugarExpedicion + "','" + FechaNacimiento + "'," + IdTecnica + ",'" + imagePath+ "','" + certificadoPath+ "','" + certificadoPathMD+ "','" + VacunasPath+ "','" + FechaVA+ "','" + TprofesionalPath+ "','" + fechaVM+ "','" + ContePath+ "','"+email+"');";
                }
                //console.log(imagePath);
                //console.log(certificadoPath);
                auxCertificadoA.saveCertificadoA(certificadoPath, base64Certificado).then((CertificadoAResult) => {
                    //console.log("************************************** MUESTRA Certificado RESULT************");
                    //console.log(data.CertificadodeAlturas);
                    //console.log(CertificadoAResult);
                    //console.log("************************************** MUESTRA Certificado RESULT************");
                 res.json(CertificadoAResult);
                })
                auxCertificadoMD.saveCertificadoMD(certificadoPathMD, base64CertificadoMD).then((CertificadoAResultMD) => {
                    //console.log("************************************** MUESTRA Certificado MD RESULT************");
                    //console.log(data.CertificadoMD);
                    //console.log(CertificadoAResultMD);
                    //console.log("************************************** MUESTRA Certificado MD RESULT************");
                 res.json(CertificadoAResultMD);
                })
                auxVacunas.saveVacunas(VacunasPath, base64V).then((VacunasResult) => {
                    //console.log("************************************** MUESTRA Vacunas RESULT************");
                    //console.log(data.Vacunas);
                    //console.log(VacunasResult);
                    //console.log("************************************** MUESTRA Vacunas RESULT************");
                 res.json(VacunasResult);
                })
                auxTprofesional.saveTprofesional(TprofesionalPath, base64T).then((TprofesionalResult) => {
                    //console.log("************************************** MUESTRA Tprofesional RESULT************");
                    //(console.log(data.Tprofesional);
                    //console.log(TprofesionalResult);
                    //console.log("************************************** MUESTRA Tprofesiona RESULT************");
                 res.json(TprofesionalResult);
                })
                auxConte.saveConte(ContePath, base64C).then((ConteResult) => {
                    //console.log("************************************** MUESTRA Tprofesional RESULT************");
                    //console.log(data.Conte);
                    //console.log(ConteResult);
                    //console.log("************************************** MUESTRA Tprofesiona RESULT************");
                 res.json(ConteResult);
                })
                

                con.query(query, async (error, result, fields) => {
                    if (data.Foto) {
                        console.log(" ENTRA A QUERY ");
                        console.log(error);
                        console.log(" MOSTRO ERROR ")
                        auxImage.saveImage(imagePath, base64Image).then((imageResult) => {
                            res.json(imageResult)
                        })
                       
                    } else  res.json((error)? "false" : "true");
                    console.log(error);
                    console.log("SALE");


                })//no se toca
            }else{
                console.log("ERROR ID duplicado");
                res.json("duplicated");
            }
        }
    })

});

//para traer la lista de status
router.get("/statusList",(req, res, err) => {
    let query = "SELECT * FROM status;";
    con.query(query, (error, result) => {
        if(error){
            res.json("false");
        }else{
            res.json(result);
        }
    })
})


//Para editar usuarios en desktop
router.post("/editWorker", (req, res, err) => {
    let data = req.body;
    console.log(data.Foto);
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
    let email = data.email;

    let promesaInicial = new Promise((resolve, reject) => {
    var query = "SELECT CedulaCiudadania FROM especialista WHERE IdEspecialista=" + IdEspecialista+";";
        con.query(query, (error, result) => {
            if(error){
                //console.log("Error al traer cedula");
                //res.json("false");
                reject();
            }else{
                //console.log(result[0]['CedulaCiudadania']);
                //console.log("Exito al traer cedula");
                //res.json("true");        
                resolve(result);
            }
        })
    });  
    
    promesaInicial.then((result) => {
        ////console.log("SEGUNDO QUERY**************");
        var antiguaCedula = result[0]['CedulaCiudadania'];
        let hashedPassword = bcrypt.hashSync(CedulaCiudadania, 8);
        var query2 = "UPDATE usuarioapp SET CedulaCiudadania='" + CedulaCiudadania + "', password='"+ hashedPassword + "' WHERE CedulaCiudadania='"+antiguaCedula+ "';";
        //console.log(query2);
        con.query(query2, (error2, result2) => {
            if(error2){
                //console.log("Error al actualizar cedula AppMovil");
                //res.json("false");
            }else{
                //console.log("Se ha actualizado exitosamente AppMovil");
                //res.json("true");
            }
        })
    }).then((result) => {
        var query3 = "UPDATE especialista SET NombreE='" + NombreE + "',Celular='" + Celular + "',IdTecnica=" + IdTecnica + ",FechaNacimiento='" + FechaNacimiento + "',CeCo='" + CeCo + "',GID='" + GID + "',CedulaCiudadania='" + CedulaCiudadania + "',LugarExpedicion='" + LugarExpedicion + "',TarjetaIngresoArgos='" + TarjetaIngresoArgos + "',email='" + email + "' WHERE IdEspecialista=" + IdEspecialista;
        if (data.Foto) {
            base64String = data.Foto;
            base64Image = base64String.split(';base64,').pop();
            imagePath = variables.serverDirectoryWin + 'images/Foto_' + data.IdEspecialista + ".jpg";
            query3 = "UPDATE especialista SET NombreE='" + NombreE + "',Celular='" + Celular + "',IdTecnica=" + IdTecnica + ",FechaNacimiento='" + FechaNacimiento + "',CeCo='" + CeCo + "',GID='" + GID + "',CedulaCiudadania='" + CedulaCiudadania + "',LugarExpedicion='" + LugarExpedicion + "',TarjetaIngresoArgos='" + TarjetaIngresoArgos + "',Foto='" + imagePath + "',email='" + email +"' WHERE IdEspecialista=" + IdEspecialista;
        }
        ////console.log(imagePath);
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
    //console.log(req.params.date);
    let query = "SELECT * FROM asignacion where (EXTRACT(YEAR_MONTH FROM '" + req.params.date + "') BETWEEN EXTRACT(YEAR_MONTH FROM fechaInicio) and EXTRACT(YEAR_MONTH FROM fechaFin ));";
    con.query(query, (error, result) => {
        if (error) return res.json("HUbo un error");
        //console.log("getAssignment length:", result.length);
        res.json(result);
    })
})

// Trae asignaciones de un especialista dada la cedula de ciudadania
router.get('/getWorkerAssignments/:worker', (req, res, err) => {
    let worker = req.params.worker;
    let query = "SELECT * from asignacion INNER JOIN especialista ON especialista.IdEspecialista=asignacion.IdEspecialista INNER JOIN empresa ON asignacion.IdEmpresa=empresa.IdEmpresa WHERE especialista.CedulaCiudadania='" + worker + "' ORDER BY IdAsignacion DESC LIMIT 30;";
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
    let query = " SELECT especialista.NombreE, tecnica.NombreT, status.NombreS, asignacion.IdEspecialista, asignacion.PCFSV, asignacion.IdStatus, asignacion.IdAsignacion, empresa.NombreEmpresa, empresa.IdEmpresa, asignacion.NombrePlanta, asignacion.CiudadPlanta, asignacion.StatusAsignacion, asignacion.FechaInicio, asignacion.FechaFin, asignacion.NombreSitio, asignacion.NombreContacto, asignacion.TelefonoContacto, asignacion.EmailContacto, asignacion.Descripcion, asignacion.CoordenadasSitio, asignacion.CoordenadasEspecialista FROM especialista INNER JOIN tecnica ON especialista.IdTecnica=tecnica.IdTecnica INNER JOIN asignacion ON especialista.IdEspecialista=asignacion.IdEspecialista INNER JOIN status ON asignacion.IdStatus=status.IdStatus INNER JOIN empresa ON asignacion.IdEmpresa=empresa.IdEmpresa WHERE asignacion.IdEspecialista=" + id + " AND '" + date + "' BETWEEN asignacion.FechaInicio AND asignacion.FechaFin;";
    // let query = "SELECT * from Asignacion INNER JOIN Especialista ON Especialista.IdEspecialista=Asignacion.IdEspecialista WHERE Especialista.CedulaCiudadania='10236';";
    con.query(query, (error, result) => {
        if (error){
            console.log("ERROR GET INFO ASSIG: ", error);
            return res.json("Hubo un error");
        }else{
            res.json(result);
        }
       
    })
})

// Trae info asignacion dado solo el id
router.get('/getInfoAssignment/:id', (req, res, err) => {
    let id = req.params.id;
    let query = " SELECT * FROM asignacion WHERE IdAsignacion="+id+";";
    //console.log(query);
    con.query(query, (error, result) => {
        if (error){
            return res.json("false");
        }else{
            res.json(result);
        }
       
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
    console.log("SUJETO", body.SujetoCancelacion);
    console.log("RAZON", body.RazonCancelacion);

    //Diferencia entre Hasta y FechaFin
    let diffDate2 = Math.abs(fechaFin.getTime() - hasta.getTime());
    let diffDays2 = Math.ceil(diffDate2 / (1000 * 60 * 60 * 24));

    //Primer Caso Desde = FechaInicio && Hasta < FechaFin
    if (diffDays1 == 0 && diffDays2 > 0) {
        let fechaN = new Date();
        fechaN.setDate(hasta.getDate() + 2);
        fechaN.setMonth(hasta.getMonth());
        fechaN.setHours(fechaN.getHours() - 5);
        query = "UPDATE asignacion SET FechaInicio='" + fechaN.toISOString().split("T")[0] + "' WHERE IdAsignacion=" + body.IdAsignacion + "";
        con.query(query, (error, result, fields) => {
            if (error) //console.log('Error eliminacion 1ra parte:', error);
            query2 = "INSERT INTO asignacioneliminada (PCFSV, IdEspecialista, IdStatus, IdAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion, SujetoCancelacion, RazonCancelacion) VALUES('" + body.PCFSV + "', " + body.IdEspecialista + ", " + body.IdStatus + ", " + body.IdAsignacion + ", " + body.IdEmpresa + ", '" + body.NombrePlanta + "', '" + body.CiudadPlanta + "', '" + desde.toISOString().split("T")[0] + "', '" + hasta.toISOString().split("T")[0] + "', '" + body.CoordenadasSitio + "', '', '" + body.NombreSitio + "', '" + body.NombreContacto + "', '" + body.TelefonoContacto + "', '" + body.EmailContacto + "', '" + body.Descripcion + "' ,'" + body.SujetoCancelacion + "', '" + body.RazonCancelacion + "');";
            con.query(query2, (err, result, fields) => {
                if(err) //console.log('Error eliminacion 2da parte:', err);
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
        //console.log(fechaFNOrinigal);
        let fechaINueva = new Date();
        fechaINueva.setDate(hasta.getDate() + 2);
        fechaINueva.setMonth(hasta.getMonth());
        fechaINueva.setHours(fechaINueva.getHours() - 5);
        query = "UPDATE asignacion SET FechaFin='" + fechaFNOrinigal.toISOString().split("T")[0] + "' WHERE IdAsignacion=" + body.IdAsignacion + "";
        con.query(query, (error, result, fields) => {
            if (error) //console.log('Error eliminacion 1ra parte:', error);
            query2 = "INSERT INTO asignacioneliminada (PCFSV, IdEspecialista, IdStatus, IdAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion, SujetoCancelacion, RazonCancelacion) VALUES('" + body.PCFSV + "', " + body.IdEspecialista + ", " + body.IdStatus + ", " + body.IdAsignacion + ", '" + body.IdEmpresa + "', '" + body.NombrePlanta + "', '" + body.CiudadPlanta + "', '" + desde.toISOString().split("T")[0] + "', '" + hasta.toISOString().split("T")[0] + "', '" + body.CoordenadasSitio + "', '', '" + body.NombreSitio + "', '" + body.NombreContacto + "', '" + body.TelefonoContacto + "', '" + body.EmailContacto + "', '" + body.Descripcion + "' ,'" + body.SujetoCancelacion + "', '" + body.RazonCancelacion + "');";
            con.query(query2, (err, result, fields) => {
                if (err) //console.log('Error eliminacion 2da parte:', err);
                query3 = "INSERT INTO asignacion (PCFSV, IdEspecialista, IdStatus, StatusAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, TiempoInicio, TiempoFinal, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion) VALUES('" + body.PCFSV + "', " + body.IdEspecialista + "," + body.IdStatus + ", 0, '" + body.IdEmpresa + "', '" + body.NombrePlanta + "', '" + body.CiudadPlanta + "', '" + fechaINueva.toISOString().split("T")[0] + "', '" + fechaFin.toISOString().split("T")[0] + "', null, null, '" + body.CoordenadasSitio + "', '', '" + body.NombreSitio + "', '" + body.NombreContacto + "', '" + body.TelefonoContacto + "', '" + body.EmailContacto + "', '" + body.Descripcion + "')";
                con.query(query3, (er, result, fields) => {
                    if (er) //console.log('Error eliminacion 3ra parte:', er);
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
        //console.log(fechaFN);
        query = "UPDATE asignacion SET FechaFin='" + fechaFN.toISOString().split("T")[0] + "' WHERE IdAsignacion=" + body.IdAsignacion + "";
        con.query(query, (error, result, fields) => {
            if (error) //console.log('Error eliminacion 1ra parte:', error);
            query2 = "INSERT INTO asignacioneliminada (PCFSV, IdEspecialista, IdStatus, IdAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion, SujetoCancelacion, RazonCancelacion) VALUES('" + body.PCFSV + "', " + body.IdEspecialista + ", " + body.IdStatus + ", " + body.IdAsignacion + ", '" + body.IdEmpresa + "', '" + body.NombrePlanta + "', '" + body.CiudadPlanta + "', '" + desde.toISOString().split("T")[0] + "', '" + hasta.toISOString().split("T")[0] + "', '" + body.CoordenadasSitio + "', '', '" + body.NombreSitio + "', '" + body.NombreContacto + "', '" + body.TelefonoContacto + "', '" + body.EmailContacto + "', '" + body.Descripcion + "' ,'" + body.SujetoCancelacion + "', '" + body.RazonCancelacion + "');";
            con.query(query2, (err, result, fields) => {
                if (err) //console.log('Error eliminacion 2da parte:', err);;
                return res.json((err) ? "false" : "true")
            })
        })
    }

    //Cuarto Caso Desde = FechaInicio && Hasta = FechaFin
    else if (diffDays1 == 0 && diffDays2 == 0) {
        query = "DELETE FROM asignacion WHERE IdAsignacion=" + body.IdAsignacion + "";
        con.query(query, (error, result, fields) => {
            if (error){
                console.log("ERROR EN PRIMER QUERY DELETE");
            } //console.log('Error eliminacion 1ra parte:', error);
            query2 = "INSERT INTO asignacioneliminada (PCFSV, IdEspecialista, IdStatus, IdAsignacion, IdEmpresa, NombrePlanta, CiudadPlanta, FechaInicio, FechaFin, CoordenadasSitio, CoordenadasEspecialista, NombreSitio , NombreContacto, TelefonoContacto, EmailContacto, Descripcion, SujetoCancelacion, RazonCancelacion) VALUES('" + body.PCFSV + "', " + body.IdEspecialista + ", " + body.IdStatus + ", " + body.IdAsignacion + ", '" + body.IdEmpresa + "', '" + body.NombrePlanta + "', '" + body.CiudadPlanta + "', '" + desde.toISOString().split("T")[0] + "', '" + hasta.toISOString().split("T")[0] + "', '" + body.CoordenadasSitio + "', '', '" + body.NombreSitio + "', '" + body.NombreContacto + "', '" + body.TelefonoContacto + "', '" + body.EmailContacto + "', '" + body.Descripcion + "' ,'" + body.SujetoCancelacion + "', '" + body.RazonCancelacion + "');";
            //console.log(query2);
            con.query(query2, (error, result, fields) => {
                if (error){
                    res.json("false");
                }else{
                    res.json("true");
                }
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
                                        //console.log("QUERY");
                                        //console.log(query);
    con.query(query, (error, result) => {
        if (error){ 
            //console.log(error);
            return res.json("false");
        }else{
            //console.log("Query enviado")
            return res.json("true");
        }
    })
})


// Trae las asignaciones del mes
router.get("/getMonthAssignments/:date", (req, res, err) => {
    let date = req.params.date;
    let query = "SELECT asignacion.IdEspecialista, asignacion.IdStatus, asignacion.FechaInicio, asignacion.FechaFin, especialista.IdTecnica as tecnica, especialista.NombreE, (SELECT COUNT(*) FROM especialista WHERE IdTecnica=tecnica) as Cuenta FROM asignacion INNER JOIN especialista ON asignacion.IdEspecialista=especialista.IdEspecialista WHERE YEAR(asignacion.FechaInicio) = YEAR('" + date + "') AND MONTH(asignacion.FechaInicio)=MONTH('" + date + "') OR YEAR(asignacion.FechaFin) = YEAR('" + date + "') AND MONTH(asignacion.FechaFin) = MONTH('" + date + "');";
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
    let query = "SELECT asignacion.IdEspecialista, asignacion.IdStatus, asignacion.FechaInicio, asignacion.FechaFin, especialista.IdTecnica as tecnica, (SELECT COUNT(*) FROM especialista WHERE IdTecnica=tecnica) as Cuenta FROM asignacion INNER JOIN especialista ON asignacion.IdEspecialista=especialista.IdEspecialista WHERE (EXTRACT(YEAR_MONTH FROM FechaInicio) BETWEEN '"+yearMonth1+"' AND '"+yearMonth2+"') OR (EXTRACT(YEAR_MONTH FROM FechaFin) BETWEEN '"+yearMonth1+"' AND '"+yearMonth2+"');";
    //console.log(query);
    con.query(query, (error, result) => {
        if (error) return res.json("Error");
        return res.json(result);
    })
})

// Trae TODAS las asignaciones eliminadas
router.get('/getDeletedAssignments/:date/:text', (req, res, err) => {
    let Sdate = req.params.date;
    let Stext = req.params.text;
    //console.log(Sdate, Stext);
    if (Sdate == "'null'" && Stext == "'null'") {
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM asignacioneliminada AS ae INNER JOIN especialista AS e ON ae.IdEspecialista=e.IdEspecialista ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            //console.log("getAssignment length:", result.length);
            res.json(result);
        })
    } else if (Sdate == "'null'" && Stext !== "'null'") {
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM asignacioneliminada AS ae INNER JOIN especialista AS e ON ae.IdEspecialista=e.IdEspecialista WHERE (ae.IdEspecialista LIKE '%" + Stext + "%' OR ae.NombreSitio LIKE '%" + Stext + "%' OR ae.NombreContacto LIKE '%" + Stext + "%' OR ae.TelefonoContacto LIKE '%" + Stext + "%' OR ae.Descripcion LIKE '%" + Stext + "%' OR ae.SujetoCancelacion LIKE '%" + Stext + "%' OR ae.RazonCancelacion LIKE '%" + Stext + "%' OR e.NombreE LIKE '%" + Stext + "%') ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            //console.log("getAssignment length:", result.length);
            res.json(result);
        })
    } else if (Sdate !== "'null'" && Stext == "'null'") {
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM asignacioneliminada AS ae INNER JOIN especialista AS e ON ae.IdEspecialista=e.IdEspecialista WHERE ('" + Sdate + "' BETWEEN ae.FechaInicio AND ae.FechaFin) ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            //console.log("getAssignment length:", result.length);
            res.json(result);
        })
    } else {
        //console.log('Entra aqui');
        let query = "SELECT ae.IdEspecialista, ae.FechaInicio, ae.FechaFin, ae.NombreSitio, ae.NombreContacto, ae.TelefonoContacto, ae.Descripcion, ae.SujetoCancelacion, ae.RazonCancelacion, e.NombreE FROM asignacioneliminada AS ae INNER JOIN especialista AS e ON ae.IdEspecialista=e.IdEspecialista WHERE ('" + Sdate + "' BETWEEN ae.FechaInicio AND ae.FechaFin) AND (ae.IdEspecialista LIKE '%" + Stext + "%' OR ae.NombreSitio LIKE '%" + Stext + "%' OR ae.NombreContacto LIKE '%" + Stext + "%' OR ae.TelefonoContacto LIKE '%" + Stext + "%' OR ae.Descripcion LIKE '%" + Stext + "%' OR ae.SujetoCancelacion LIKE '%" + Stext + "%' OR ae.RazonCancelacion LIKE '%" + Stext + "%' OR e.NombreE LIKE '%" + Stext + "%') ORDER BY IdAsignacionE DESC;";
        con.query(query, (error, result) => {
            if (error) return res.json("Hubo un error");
            //console.log("getAssignment length:", result.length);
            res.json(result);
        })
    }
})

router.post("/updateCoords", (req, res) => {
    let data = req.body;
    //console.log("COORDENADAS ESPECIALISTA");
    //console.log("Coords", data);
    let query = "UPDATE asignacion SET CoordenadasEspecialista='" + data.Coords + "' WHERE IdAsignacion=" + data.IdAsignacion + ";";
    
    if (data.Coords.length != 0) {
        con.query(query, (error, result) => {
            //console.log("Dentro de update");
            return res.json((error) ? "true" : "false");
        })
    }
})

//para traer los reportes hechos por cada especialista para ver en app movil
router.get("/getReportes/:user", (req, res) => {
    let cedula = req.params.user;
    let query = "SELECT ";
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
    let query = "Insert into reportegeneral(Consecutivo, IdEmpresa, NombreContacto, NombreColaborador, NombreProyecto, DescripcionAlcance, HojaTiempo, Marca, DenominacionInterna, NumeroProducto, NumeroSerial, CaracteristicasTecnicas, EstadoInicial, ActividadesRealizadas, Conclusiones, RepuestosSugeridos , ActividadesPendientes, FirmaEmisor , FirmaCliente, IdAsignacion, FechaEnvio, Adjuntos) VALUES ('" + Consecutivo + "', " + IdEmpresa + ", '" + NombreContacto + "', '" + NombreColaborador + "', '" + NombreProyecto + "', '" + DescripcionAlcance + "', '" + HojaTiempo + "', '" + Marca + "', '" + DenominacionInterna + "', '" + NumeroProducto + "', '" + NumeroSerial + "', '" + CaracteristicasTecnicas + "', '" + EstadoInicial + "', '" + ActividadesRealizadas + "', '" + Conclusiones + "', '" + RepuestosSugeridos + "', '" + ActividadesPendientes + "', '" + FirmaEmisor + "', '" + FirmaCliente + "', " + IdAsignacion + ", '" + FechaEnvio + "', '" + Adjuntos + "');";
    con.query(query, (error, result) => {
        //console.log(error);
        return res.json((error) ? "false" : "true");
    })
});


router.post('/updateTimeStamps', (req, res, err) => {
    let tiempoInicio = req.body.tiempoInicio;
    let tiempoFin = req.body.tiempoFin;
    let IdAsignacion = req.body.IdAsignacion;
    var status = req.body.StatusAsignacion;
    //console.log(req.body);
    if (tiempoFin == '' && tiempoInicio !== "") {
        let query = "UPDATE asignacion SET TiempoInicio = '" + tiempoInicio + "', StatusAsignacion=" + status + " WHERE IdAsignacion=" + IdAsignacion + "";
        //console.log(query);
        con.query(query, (error, result) => {
            if (error) return res.json("Error en la base de datos");
            else {
                // auxPush.notifNewAssignment(fakeDatabase['Desktop'], 'assignmentStarted');
                return res.json("Registro actualizado");
            }
        })
    } else if (tiempoInicio == "" && tiempoFin !== '') {
        let query = "UPDATE asignacion SET TiempoFinal = '" + tiempoFin + "', StatusAsignacion=" + status + " WHERE IdAsignacion=" + IdAsignacion + "";
        //console.log(query);
        con.query(query, (error, result) => {
            if (error) return res.json("Error en la base de datos");
            else {
                res.json("Registro actualizado");
            }
        })
    } else {
        let query = "UPDATE asignacion SET StatusAsignacion=" + status + " WHERE IdAsignacion=" + IdAsignacion + "";
        //console.log(query);
        con.query(query, (error, result) => {
            if (error) return res.json("Error en la base de datos");
            else {
                res.json("Registro actualizado");
            }
        })
    }
    ////console.log(query);
})

/**-------------------------    EQUIPO ---------------------------------- */

//Traer Cliente, Serial y Tipo ( Se puede filtrar por Empresa, TipoEquipo, MLFB)
router.post("/getEquipmentsBy", (req, res) => {

    let NombreEmpresa = (req.body.nombre == undefined) ? "" : req.body.nombre;
    let TipoEquipo = (req.params.tipo) ? "" : req.body.tipo;
    let MLFB = (req.params.mlfb) ? "" : req.body.mlfb;
    let Serial = (req.params.serial)? "" : req.body.serial;
    let query = "SELECT equipo.NumeroSerial, empresa.NombreEmpresa, equipo.TipoEquipo FROM equipo INNER JOIN empresa ON equipo.IdEmpresa=empresa.IdEmpresa WHERE empresa.NombreEmpresa LIKE '%" + NombreEmpresa + "%' AND equipo.TipoEquipo LIKE '%" + TipoEquipo + "%' AND equipo.MLFB LIKE '%" + MLFB + "%' AND equipo.NumeroSerial LIKE '%" + Serial + "%';";
    //console.log(req.body);
    //console.log(query);
    con.query(query, (error, result) => {
        if (error) return res.json("Hubo un error");
        res.json(result);

    })
})


//Traer datos del Equipo por Serial
router.get("/getEquipmentBySerial/:serial", (req, res) => {
    let NumeroSerial = req.params.serial
    let query = "SELECT equipo.NumeroSerial, empresa.NombreEmpresa, equipo.MLFB, equipo.TipoEquipo, equipo.Descripcion, equipo.CicloVida, equipo.FechaProduccion, equipo.AñosOperacion, equipo.NumeroContrato, equipo.Planta, equipo.Ciudad, equipo.Fecha, equipo.Periodo, equipo.Vence, equipo.NombreResponsable, equipo.TelefonoResponsable, equipo.EmailResponsable, equipo.NombrePM, equipo.TelefonoPM, equipo.EmailPM FROM equipo INNER JOIN empresa ON equipo.IdEmpresa=empresa.IdEmpresa WHERE equipo.NumeroSerial='" + NumeroSerial + "';";

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

    let queryNombre = "SELECT IdEmpresa from empresa where NombreEmpresa = '" + NombreCliente + "';";
    con.query(queryNombre, (error, result) => {
        if (error) return res.json("false");        
        let IdEmpresa = result[0]['IdEmpresa'];
        let query = "INSERT INTO equipo (NumeroSerial, IdEmpresa, NumeroContrato, Planta, Ciudad, Fecha, Periodo, Vence, NombreResponsable, TelefonoResponsable, EmailResponsable, NombrePM, TelefonoPM, EmailPM, MLFB, TipoEquipo, Descripcion, CicloVida, FechaProduccion, AñosOperacion) values ('" + NumeroSerial + "', " + IdEmpresa + ", '" + NumeroContrato +"', '" + Planta + "', '" + Ciudad + "', '" + Fecha + "', '" + Periodo + "', '" + Vence + "', '" + NombreResponsable + "', '" + TelefonoResponsable + "', '" + EmailResponsable + "', '" + NombrePM + "', '" + TelefonoPM + "', '" + EmailPM + "', '" + MLFB +  "', " + TipoEquipo + ", '" + Descripcion + "', '" + CicloVida + "', '" + FechaProduccion + "', " + AñosOperacion + ")";
        //console.log('Get equipment by serial:', resultado)
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

    let queryNombre = "SELECT IdEmpresa from empresa where NombreEmpresa = '" + NombreCliente + "';";
    //console.log('Body:', req.body);
    
    con.query(queryNombre, (error, result) => {
        if (error) return res.json("false");
        //console.log('IdEmpresa:', result[0]['IdEmpresa']);        
        let IdEmpresa = result[0]['IdEmpresa'];
        let query = "UPDATE equipo SET AñosOperacion='" + AñosOperacion + "', Ciudad='" + Ciudad + "', Descripcion='" + Descripcion + "', EmailPM='" + EmailPM + "', EmailResponsable='" + EmailResponsable + "', Fecha='" + Fecha + "', FechaProduccion='" + FechaProduccion + "', MLFB='" + MLFB + "', IdEmpresa=" + IdEmpresa + ", NombrePM='" + NombrePM + "', NumeroContrato='" + NumeroContrato + "', NumeroSerial='" + NumeroSerial + "', Periodo='" + Periodo + "', Planta='" + Planta + "', NombreResponsable='" + NombreResponsable + "', TelefonoPM='" + TelefonoPM + "', TelefonoResponsable='" + TelefonoResponsable + "', TipoEquipo=" + TipoEquipo + ", CicloVida='" + CicloVida + "', Vence='" + Vence + "' WHERE NumeroSerial='" + currentSerial + "';";
        //console.log('Query:', query);
        //console.log('Get equipment by serial:', result)
        con.query( query, (err, resultado) => {
            return res.json((err) ? "false" : "true");
        })
    })
})


/**  -------------------- REPORTES --------------------------------------- */

router.get("/getReportByAssignment/:id", (req, res) => {
    let IdAsignacion = req.params.id;
    console.log("ASIGNACION: ",IdAsignacion);
    let query = "SELECT RG.Consecutivo, RG.FechaEnvio, RG.NombreContacto, RG.NombreColaborador, RG.NombreProyecto, RG.DescripcionAlcance, RG.Marca, RG.DenominacionInterna, RG.NumeroSerial, RG.CaracteristicasTecnicas, RG.EstadoInicial, RG.ActividadesRealizadas, RG.Conclusiones, RG.RepuestosSugeridos, RG.ActividadesPendientes, RG.HojaTiempo, RG.FirmaEmisor, RG.FirmaCliente, RG.Adjuntos, E.NombreEmpresa, T.CostoViaje, T.CostoServicio FROM reportegeneral AS RG INNER JOIN empresa AS E ON RG.IdEmpresa=E.IdEmpresa INNER JOIN asignacion ON RG.IdAsignacion=asignacion.IdAsignacion INNER JOIN especialista ON asignacion.IdEspecialista=especialista.IdEspecialista INNER JOIN tecnica AS T ON especialista.IdTecnica=T.IdTecnica WHERE RG.IdAsignacion=" + IdAsignacion + ";";

    con.query(query, (error, result) => {
        //console.log(query)
        if (result.length == 0) {
            return res.json("false");
        } else {
            return res.json(result);
        }
    })
})

router.get("/getReportsFromEquipment/:serial", (req, res) => {
    let serial = req.params.serial;

    let query = "SELECT RG.Consecutivo, RG.FechaEnvio, RG.NombreContacto, RG.NombreColaborador, RG.NombreProyecto, RG.DescripcionAlcance, RG.Marca, RG.DenominacionInterna, RG.NumeroSerial, RG.CaracteristicasTecnicas, RG.EstadoInicial, RG.ActividadesRealizadas, RG.Conclusiones, RG.RepuestosSugeridos, RG.ActividadesPendientes, RG.HojaTiempo, RG.FirmaEmisor, RG.FirmaCliente, RG.Adjuntos, E.NombreEmpresa, T.CostoViaje, T.CostoServicio, asignacion.PCFSV FROM ReporteGeneral AS RG INNER JOIN empresa AS E ON RG.IdEmpresa=E.IdEmpresa INNER JOIN asignacion ON RG.IdAsignacion=asignacion.IdAsignacion INNER JOIN especialista ON asignacion.IdEspecialista=especialista.IdEspecialista INNER JOIN tecnica AS T ON Especialista.IdTecnica=T.IdTecnica WHERE RG.NumeroSerial='" + serial + "';";
    //let query = "SELECT * FROM reportegeneral WHERE NumeroSerial='" + serial + "';";
    con.query(query, (error, result) => {
        //console.log( result)
        return res.json(result);
    })
})


module.exports = {
    router,
    startingMysql
};