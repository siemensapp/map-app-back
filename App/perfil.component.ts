import { Component, OnInit } from '@angular/core';
import { DataRetrieverService } from '../../services/data-retriever.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {

  infoEspecialista={};
  fechaNacimiento;
  constructor(private DataRetriever: DataRetrieverService) { }

  ngOnInit() {
    this.DataRetriever.infoEspecialista.subscribe(infoEspecialista => this.infoEspecialista = infoEspecialista);
    console.log("*****************");
    console.log(this.infoEspecialista['id']);
    console.log("*****************Especialista");
    console.log(this.infoEspecialista);
    var fechahoy= this.infoEspecialista['FechaHoy'].split("T")[0];
    var fechaVA= this.infoEspecialista['fechaVA'].split("T")[0];
    var fechavm= this.infoEspecialista['fechavm'].split("T")[0];
    var fechaVA1= new Date(fechaVA).getTime();
    var fechahoy1= new Date(fechahoy).getTime();
    var fechavm1= new Date(fechavm).getTime();
    var dias = Math.floor((fechaVA1-fechahoy1)/(1000*60*60*24));
    var dias1 = Math.floor((fechavm1-fechahoy1)/(1000*60*60*24));
    console.log("*****************Fecha");
    console.log(dias);
    console.log(dias1);
    //console.log(fechaVA);
    console.log("*****************Fecha");
  
    document.getElementById('fecha').innerHTML=this.infoEspecialista['FechaNacimiento'].split("T")[0];
    document.getElementById('fechaVA').innerHTML=String(dias);
    document.getElementById('fechavm').innerHTML=String(dias1);
  }

}