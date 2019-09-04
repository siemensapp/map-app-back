import { Component, OnInit } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import * as env from '../../../../../assets/js/variables';
import Swal from 'sweetalert2'; 
import { Router } from '@angular/router';


@Component({
  selector: 'app-especialista',
  templateUrl: './especialista.component.html',
  styleUrls: ['./especialista.component.scss']
})

export class EspecialistaComponent implements OnInit {

  constructor(private httpService: HttpClient, private router: Router) { }
  
  fechaMinima;
  subirArchivo(){
    var click = document.getElementById("fileInput");   
    click.click();
    click.onchange = function(event){

      console.log("***********************entro a convertir imagen*************************");
        //Previsualizar la imagen en el div campoImagen
        var campoImagen = <HTMLImageElement>document.getElementById("campoImagen");

        campoImagen.src = URL.createObjectURL((<HTMLInputElement>event.target).files[0]);
        //Crear version base 64 de la img
        var fileReader = new FileReader();
        fileReader.addEventListener("load", function(e:any){
           
           document.getElementById("resultadoImagen").innerHTML = e.target.result;
           
        })

        fileReader.readAsDataURL((<HTMLInputElement>event.target).files[0]);
        
    };
  }

  processFile1(documentInput: any){
  //  debugger;
  console.log("******************estoy adentro 1*****************");
    var doc : File = documentInput.files[0];
    var reader = new FileReader();

    reader.addEventListener('load',function(a:any){
           
      document.getElementById("resultadoCertificadoA").innerHTML = a.target.result;
      
   })
   reader.readAsDataURL((<HTMLInputElement>event.target).files[0]);
  }

  processFile2(documentInput: any){
    //  debugger;
    console.log("******************estoy adentro 2*****************");
      var doc : File = documentInput.files[0];
      var reader = new FileReader();
  
      reader.addEventListener('load',function(a:any){
             
        document.getElementById("resultadoCertificadoMD").innerHTML = a.target.result;
        
     })
     reader.readAsDataURL((<HTMLInputElement>event.target).files[0]);
    }

    processFile3(documentInput: any){
      //  debugger;
      console.log("******************estoy adentro 3*****************");
        var doc : File = documentInput.files[0];
        var reader = new FileReader();
    
        reader.addEventListener('load',function(a:any){
               
          document.getElementById("resultadoVacunas").innerHTML = a.target.result;
          
       })
       reader.readAsDataURL((<HTMLInputElement>event.target).files[0]);
      }

      processFile4(documentInput: any){
        //  debugger;
        console.log("******************estoy adentro 4*****************");
          var doc : File = documentInput.files[0];
          var reader = new FileReader();
      
          reader.addEventListener('load',function(a:any){
                 
            document.getElementById("resultadoTprofesional").innerHTML = a.target.result;
            
         })
         reader.readAsDataURL((<HTMLInputElement>event.target).files[0]);
        }

        processFile5(documentInput: any){
          //  debugger;
          console.log("******************estoy adentro 5*****************");
            var doc : File = documentInput.files[0];
            var reader = new FileReader();
        
            reader.addEventListener('load',function(a:any){
                   
              document.getElementById("resultadoConte").innerHTML = a.target.result;
              
           })
           reader.readAsDataURL((<HTMLInputElement>event.target).files[0]);
          }

  agregarEspecialista(){

    var datos3 = document.forms["formulario"].elements[2].value;
    var datos4 = document.forms["formulario"].elements[3].value;
    var datos5 = document.forms["formulario"].elements[4].value;
    var datos6 = document.forms["formulario"].elements[5].value;
    var datos7 = document.forms["formulario"].elements[6].value;
    var datos8 = document.forms["formulario"].elements[7].value;
    var datos9 = document.forms["formulario"].elements[8].value;
    var datos10 = document.forms["formulario"].elements[9].value;
    var datos11 = document.forms["formulario"].elements[10].value;
    var datos12 = document.forms["formulario"].elements[11].value;
    var datos13 = document.forms["formulario"].elements[13].value;
    var datos14 = document.forms["formulario"].elements[15].value;

    var datos = {"IdEspecialista" : datos3,
                 "NombreE" : datos4,
                 "Celular" : datos5,
                 "IdTecnica" : datos6,
                 "FechaNacimiento" : datos7,
                 "CeCo" : datos8,
                 "GID" : datos9,
                 "CedulaCiudadania" : datos10,
                 "LugarExpedicion" : datos11,
                 "TarjetaIngresoArgos" : datos12,
                 "CertificadodeAlturas" : document.getElementById("resultadoCertificadoA").innerHTML,
                 "CertificadoMD" : document.getElementById("resultadoCertificadoMD").innerHTML,
                 "Vacunas" : document.getElementById("resultadoVacunas").innerHTML, 
                 "Tprofesional" : document.getElementById("resultadoTprofesional").innerHTML,
                 "Conte": document.getElementById("resultadoConte").innerHTML,               
                 "Foto" : document.getElementById("resultadoImagen").innerHTML,
                 "FechaVA": datos13,
                 "FechaVM": datos14
                };
              
    if(datos3==""){
      Swal.fire(
        'Campos requeridos',
        'Debe completar el campo Id Especialista',
        'warning'
       )
    }else if(datos8==""){
      Swal.fire(
        'Campos requeridos',
        'Debe completar el campo CeCo',
        'warning'
       )
    }else if(datos4==""){
      Swal.fire(
        'Campos requeridos',
        'Debe completar el campo Nombre Especialista',
        'warning'
       )
    }else if(datos5==""){
      Swal.fire(
        'Campos requeridos',
        'Debe completar el campo Celular',
        'warning'
       )            
    }else if(datos9==""){
      Swal.fire(
        'Campos requeridos',
        'Debe completar el campo GID',
        'warning'
       )
    }else if(datos10==""){
      Swal.fire(
        'Campos requeridos',
        'Debe completar el campo Cedula Ciudadania',
        'warning'
       )
    }else if(datos11==""){
      Swal.fire(
        'Campos requeridos',
        'Debe completar el campo Lugar Expedicion Cedula',
        'warning'
       )
    }else if(datos7==""){
      Swal.fire(
        'Campos requeridos',
        'Debe completar el campo Fecha Nacimiento',
        'warning'
       )
    }
    else{
    this.httpService.post(env.url + '/api/createWorker', datos).toPromise()
                .then((res) => {
                  console.log(datos);
                  console.log(res);
                  if(res == "true"){
                      Swal.fire(
                       'Especialista Agregado',
                       datos4,
                       'success'
                      )
                      this.router.navigate(['/main/field-service']);
                  }else if(res == "duplicated"){
                      Swal.fire(
                        'ERROR: Id Especialista duplicado',
                        datos3,
                        'error'
                      )
                  }else{
                    Swal.fire(
                      'Error agregando a',
                      datos4,
                      'error'
                    )  
                  }
                });
              }
  }

  agregarEspecialistaAppMovil(){
    var cedula = document.forms["formulario"].elements[9].value;
    var IdEspecialista = document.forms["formulario"].elements[2].value;

    var datos = {"cedula": cedula,
                "password": cedula,
                'IdEspecialista':IdEspecialista
    };

    this.httpService.post(env.url + '/api/registerApp', datos).toPromise()
                .then((res) => {
                  if(res == "true"){
                      Swal.fire(
                       'Especialista Agregado App Movil',
                       cedula,
                       'success'
                      )
                      this.router.navigate(['/main/field-service']);
                  }else if(res == "duplicated"){
                    Swal.fire(
                      'ERROR: Id Especialista duplicado',
                      cedula,
                      'error'
                    )
                  }else{
                    Swal.fire(
                      'Error agregando AppMovil',
                      cedula,
                      'error'
                    )  
                  }
                });
  }

  ngOnInit() {
    this.fechaMinima = new Date().toISOString().split("T")[0];
  }

}