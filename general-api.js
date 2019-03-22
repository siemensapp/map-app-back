const express = require('express');
const request = require('request');
const mysql = require('mysql');
const cors = require('cors');

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

router.get("/workersList", (req, res, err) => {
    console.log("Connected to get all List")
    var workersQuery;
    con.query("SELECT Especialista.NombreE, Especialista.Celular, Tecnica.NombreT, Asignacion.IdAsignacion, Status.NombreS from Especialista inner join Tecnica on Especialista.IdTecnica=Tecnica.IdTecnica inner join Asignacion on Especialista.IdEspecialista = Asignacion.IdEspecialista inner join status on Asignacion.IdStatus=Status.IdStatus WHERE CURDATE() BETWEEN Asignacion.FechaInicio AND Asignacion.FechaFin", (error, result, fields) => {
        if (error) throw error;
        workersQuery = result;
        console.log(workersQuery);
        res.json(workersQuery);
    }),     
    console.log("Done with get all List")
});



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
module.exports = { router, startingMysql };