-- MySQL dump 10.13  Distrib 8.0.15, for Win64 (x86_64)
--
-- Host: localhost    Database: fieldservice
-- ------------------------------------------------------
-- Server version	8.0.15

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 SET NAMES utf8mb4 ;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table asignacion
--

DROP TABLE IF EXISTS asignacion;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE asignacion (
  IdEspecialista int(20) NOT NULL,
  IdStatus int(20) NOT NULL,
  IdAsignacion int(20) NOT NULL AUTO_INCREMENT,
  PCFSV varchar(1) DEFAULT NULL,
  IdEmpresa int(2) NOT NULL,
  NombrePlanta varchar(100) NOT NULL,
  CiudadPlanta varchar(50) NOT NULL,
  StatusAsignacion int(1) NOT NULL,
  TiempoInicio datetime DEFAULT NULL,
  TiempoFinal datetime DEFAULT NULL,
  FechaInicio date NOT NULL,
  FechaFin date NOT NULL,
  CoordenadasSitio varchar(60) DEFAULT NULL,
  CoordenadasEspecialista varchar(60) DEFAULT NULL,
  NombreSitio varchar(60) DEFAULT NULL,
  NombreContacto varchar(60) DEFAULT NULL,
  TelefonoContacto varchar(10) DEFAULT NULL,
  EmailContacto varchar(50) NOT NULL,
  Descripcion varchar(255) DEFAULT NULL,
  PRIMARY KEY (IdAsignacion),
  KEY Empresa_Asignacion (IdEmpresa),
  KEY Especialista_Asignacion (IdEspecialista),
  KEY Status_Asignacion (IdStatus),
  CONSTRAINT Empresa_Asignacion FOREIGN KEY (IdEmpresa) REFERENCES empresa (IdEmpresa) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT Especialista_Asignacion FOREIGN KEY (IdEspecialista) REFERENCES especialista (IdEspecialista) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT Status_Asignacion FOREIGN KEY (IdStatus) REFERENCES status (IdStatus) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table asignacion
--

LOCK TABLES asignacion WRITE;
/*!40000 ALTER TABLE asignacion DISABLE KEYS */;
/*!40000 ALTER TABLE asignacion ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table asignacioneliminada
--

DROP TABLE IF EXISTS asignacioneliminada;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE asignacioneliminada (
  IdEspecialista int(20) NOT NULL,
  IdStatus int(20) NOT NULL,
  IdAsignacionE int(20) NOT NULL AUTO_INCREMENT,
  PCFSV varchar(1) DEFAULT NULL,
  IdEmpresa int(2) NOT NULL,
  NombrePlanta varchar(100) NOT NULL,
  CiudadPlanta varchar(50) NOT NULL,
  FechaInicio date NOT NULL,
  FechaFin date NOT NULL,
  CoordenadasSitio varchar(60) DEFAULT NULL,
  CoordenadasEspecialista varchar(60) DEFAULT NULL,
  NombreSitio varchar(60) DEFAULT NULL,
  NombreContacto varchar(60) DEFAULT NULL,
  TelefonoContacto varchar(10) DEFAULT NULL,
  EmailContacto varchar(50) NOT NULL,
  Descripcion varchar(255) DEFAULT NULL,
  SujetoCancelacion varchar(60) DEFAULT NULL,
  RazonCancelacion varchar(255) DEFAULT NULL,
  IdAsignacion int(20) NOT NULL,
  PRIMARY KEY (IdAsignacionE),
  KEY Empresa_AsignacionEliminada (IdEmpresa),
  CONSTRAINT Empresa_AsignacionEliminada FOREIGN KEY (IdEmpresa) REFERENCES empresa (IdEmpresa) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table asignacioneliminada
--

LOCK TABLES asignacioneliminada WRITE;
/*!40000 ALTER TABLE asignacioneliminada DISABLE KEYS */;
/*!40000 ALTER TABLE asignacioneliminada ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table empresa
--

DROP TABLE IF EXISTS empresa;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE empresa (
  IdEmpresa int(2) NOT NULL AUTO_INCREMENT,
  NombreEmpresa varchar(100) NOT NULL,
  PRIMARY KEY (IdEmpresa)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table empresa
--

LOCK TABLES empresa WRITE;
/*!40000 ALTER TABLE empresa DISABLE KEYS */;
INSERT INTO empresa VALUES (1,'ACERIAS DE COLOMBIA S.A.S'),(2,'ACERIAS PAZ DEL RIO S.A.'),(3,'ALPINA PRODUCTOS ALIMENTICIOS S.A.'),(4,'AMCOR RIGID PLASTICS DE COLOMBIA S.A.'),(5,'BAVARIA S.A.'),(6,'BAYER CROPSCIENCE S.A.'),(7,'C.I. PRODECO S.A.'),(8,'CABLES DE ENERGIA Y TELECOMUNICACIONES S.A.'),(9,'CARVAJAL PULPA Y PAPEL S.A.'),(10,'CEMENTOS ARGOS S.A.'),(11,'CEMENTOS TEQUENDAMA'),(12,'CEMENTOS TEQUENDAMA S.A.'),(13,'CEMEX COLOMBIA S.A.'),(14,'CERVECERIA UNION S.A.'),(15,'CHALLENGER S.A.S.'),(16,'CIA. DE GALLETAS NOEL S.A.'),(17,'COCACOLA FEMSA'),(18,'COLOMBINA S.A.'),(19,'COLTABACO'),(20,'CONTECAR'),(21,'DRINKS DE COLOMBIA S.A.S'),(22,'ECOPETROL S.A.'),(23,'FABRICATO S.A.'),(24,'FLEXO SPRING'),(25,'GRUPO PHOENIX'),(26,'HOCOL S.A.'),(27,'HOLCIM COLOMBIA S.A.'),(28,'INDUSTRIAS UNIDAS METALURGICAS S.A.'),(29,'INGENIO CARMELITA S.A.'),(30,'INGENIO LA CABAÑA S.A.'),(31,'INGENIO PROVIDENCIA S.A.'),(32,'INGENIO RISARALDA'),(33,'INGENIO RISARALDA S.A.'),(34,'INGENIO SAN CARLOS'),(35,'KAESER'),(36,'KAESER COMPRESORES DE COLOMBIA LTDA.'),(37,'LEONISA S.A.'),(38,'LINDE COLOMBIA S.A.'),(39,'MEALS DE COLOMBIA S.A.S.'),(40,'MULTIDIMENSIONALES S.A.'),(41,'NACIONAL DE CHOCOLATES S.A.'),(42,'NESTLÉ PURINA PETCARE DE COLOMBIA S.A.'),(43,'OLEODUCTO DE LOS LLANOS ORIENTALES S.A.'),(44,'PAVCO'),(45,'PCH SUBA'),(46,'PCH USAQUEN'),(47,'PGI COLOMBIA  LTDA'),(48,'POSTOBON S.A.'),(49,'PRODUCTOS ALIMENTICIOS DORIA S.A.S.'),(50,'PRODUCTOS FAMILIA S.A.'),(51,'PROPILCO S.A.'),(52,'PUERTO BRISA S.A.'),(53,'QUALA S.A.'),(54,'RED EAGLE'),(55,'SMURFIT KAPPA CARTON DE COLOMBIA S.A'),(56,'SOCIEDAD PORTUARIA REGIONAL DE BUENAVENTURA S.A.'),(57,'SOCIEDAD PORTUARIA REGIONAL DE CARTAGENA S.A'),(58,'SOFASA S.A.'),(59,'T.C.BUEN S.A.'),(60,'TABLEMAC'),(61,'TERMINAL DE CONTENEDORES DE CARTAGENA S.A'),(62,'TUNEL DE OCCIDENTE');
/*!40000 ALTER TABLE empresa ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table equipo
--

DROP TABLE IF EXISTS equipo;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE equipo (
  NumeroSerial varchar(50) NOT NULL,
  IdEmpresa int(2) NOT NULL,
  NumeroContrato varchar(30) DEFAULT NULL,
  Planta varchar(50) DEFAULT NULL,
  Ciudad varchar(60) DEFAULT NULL,
  Fecha date DEFAULT NULL,
  Periodo varchar(100) DEFAULT NULL,
  Vence date DEFAULT NULL,
  NombreResponsable varchar(60) DEFAULT NULL,
  TelefonoResponsable varchar(10) DEFAULT NULL,
  EmailResponsable varchar(50) DEFAULT NULL,
  NombrePM varchar(60) DEFAULT NULL,
  TelefonoPM varchar(10) DEFAULT NULL,
  EmailPM varchar(50) DEFAULT NULL,
  MLFB varchar(30) DEFAULT NULL,
  TipoEquipo int(1) NOT NULL,
  Descripcion text,
  CicloVida varchar(70) DEFAULT NULL,
  FechaProduccion date DEFAULT NULL,
  AñosOperacion double DEFAULT NULL,
  PRIMARY KEY (NumeroSerial),
  KEY Empresa_Equipo (IdEmpresa),
  CONSTRAINT Empresa_Equipo FOREIGN KEY (IdEmpresa) REFERENCES empresa (IdEmpresa) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table equipo
--

LOCK TABLES equipo WRITE;
/*!40000 ALTER TABLE equipo DISABLE KEYS */;
INSERT INTO equipo VALUES ('1234',6,'9876543','Bogotá','Bogotá','2019-07-23','','0000-00-00','alguien importante','345678','alguien@alguien.com','Diego Rodriguez','3456789','diego.rodriguez@siemens.com','algo con sentido',1,'PLC de los buenos','PM 300 Active','0000-00-00',0),('3001240950-102-001',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3710-1GE33-1AA0',4,'SINAMICS G150 Converter cabinet unit, AC/AC 380-480V 3AC, 50/60 Hz Type rating: 160kW 6-pulse supply without power recovery Version A, incl. EMC filter 2nd environment, Category C3','Product Discontinuation (P.M 490)',NULL,NULL),('3001597469-102-001',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SE6440-2UD21-1AA1',4,'MICROMASTER 440 without filter 380-480 V 3 AC +10/-10% 47-63 Hz Constant torque 1.1 kW Overload 150% 60s, 200% 3S Square-law torque 1.1 kW 173x 73x 149 (HxWxD) Degree of protection IP20 Ambient temperature -10+50 °C without AOP/BOP','Announcement of Product Phaseout (P.M 400)',NULL,NULL),('3001597469-112-001',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3710-1GE36-1AA0',4,'SINAMICS G150 Converter cabinet unit, AC/AC 380-480V 3AC, 50/60 Hz Type rating: 315 kW 6-pulse supply without power recovery Version A, incl. EMC filter 2nd environment, Category C3','Product Discontinuation (P.M 490)',NULL,NULL),('491270704031',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'3WL1112-3FB32-1AA2',2,'fixed-mounted circuit breaker  3-pole, size I, IEC In=1250A to  690V, AC50/60Hz Icu=66kA at  500V rear connection horizontal','Product Delivery Release (P.M 300)',NULL,NULL),('A5E00511087',28,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SN1111-0AA01-1AA1',3,'***SPARE PART*** SIMODRIVE 611 MAINS FILTER FOR UNREGULATED POWER SUPPLY 10 KW UP TO 480 V SUPPLY VOLTAGE','Product Cancellation (P.M 410)',NULL,NULL),('D8159587583',50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6ES7315-6TG10-0AB0',1,'SIMATIC S7-300, CPU 315T-2 DP, CENTRAL PROCESSING UNIT FOR PLC AND TECHNOLOGY 128 KBYTE WORKING MEMORY, 1. INTERFACE MPI/DP 12MBIT/S 2. INTERFACE DP(DRIVE), INTEGRATED I/O FOR TECHNOLOGY FRONT CONNECTOR (1 X 40PIN) AND MICRO MEMORY CARD MIN. 4MB NECESSARY','End of product life cycle (P.M 500)',NULL,NULL),('N-A21286176020001',59,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3720-1TE37-5AA0',4,'SINAMICS S120 Cabinet Module Single Motor Module Input: 510-720 V DC Output: 0-480V 3AC, 745 A Type rating: 400kW Cabinet unit IP20 air cooling','Product Discontinuation (P.M 490)',NULL,NULL),('N-A21286177070001',59,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3730-7TE41-4BC0',4,'SINAMICS S120 Cabinet Module  Active Line Module incl. Active  interface module 380-480V 3AC,  50/60 Hz, 1405 A Output:  510-720 V DC Type rating: 900kW  Cabinet unit IP20 air cooling,  Mirrored version','Product Discontinuation (P.M 490)',NULL,NULL),('N-A31287954011002',59,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'1PH7288-0AC00-0AA6',3,'SIMOTICS M Compact induction motor 190kW, 800rpm, 2268Nm 365A, 370V, VC operation without brake with fan, NDE top Air direction from BS to DS 3 AC 400/480V, 50/60 Hz No motor encoder Terminal box NDE right; Cable below, Encoder connector DE; Type of construction IM B3 Bearing for coupling output Vibration severity grade N, Shaft and flange accuracy N Fitted key + half-key balancing IP55 special finish (RAL 7016)','Product Cancellatio (P.M 410)',NULL,NULL),('N-C41353924010001',50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'1PH7184-2JF00-0FB3',3,'SIMOTICS M Compact induction motor 51kW, 1500rpm, 324.7Nm VC: 60kW, 1750rpm, 327.4Nm 122A, without brake with fan Cable gland entry Relative motor encoder HTL 2048 incr./rev. Terminal box on top, Cable on right Type of construction IM B3 Bearing for belt output Vibration severity grade R, Shaft and flange accuracy R Fitted key + half-key balancing Direction of air flow from NDE to DE IP55, Fan IP54 standard paint finish (RAL 7016)','Product Cancellation (P.M 410)',NULL,NULL),('N-C61355971020001',56,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3730-7TE41-0BC3',4,'SINAMICS S120 Cabinet Module  Active Line Module incl. Active  interface module incl. active  interface module 380-480V 3AC,  50/60 Hz, 985A Output: 510-720  V DC Rated power: 630kW Cabinet  unit IP20 air cooling, version  for parallel connection','Product Delivery Release (P.M 300)',NULL,NULL),('N-C61355971040001',56,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3730-7TE41-0BA3',4,'SINAMICS S120 Cabinet Module Active Line Module incl. Active interface module incl. active interface module 380-480V 3AC, 50/60 Hz, 985A Output: 510-720 V DC Rated power: 630kW Cabinet unit IP20 air cooling','Product Delivery Release (P.M 300)',NULL,NULL),('N-C61355972030001',56,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3700-0LE42-0BA3',4,'SINAMICS S120 Cabinet Module Line Connection Module 380-480V 3AC, 50/60 Hz Rated current: 2000A Cabinet unit IP20 air cooling Version for two line modules in parallel connection','Product Delivery Release (P.M 300)',NULL,NULL),('N-DD1404360010001',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3710-2GH41-4AA3',4,'SINAMICS G150 Converter cabinet unit, AC/AC with CIM+CU320-2 660-690V 3AC, 50/60 Hz Type rating: 1350kW 6-12-pulse infeed without power recovery Version A, incl. EMC filter 2nd environment, Category C3','Product Delivery Release (P.M 300)',NULL,NULL),('N-E51414867010001',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SR4102-2HC41-2EJ0',4,'SINAMICS PERFECT HARMONY GH180  medium-voltage converter  max. 6.6 kV, 100 A cells,  transformer 1250 kVA,  type rating 1130 kVA,  degree of protection,  IP21/NEMA1, air-cooled','Product Delivery Release (P.M 300)',NULL,NULL),('N-FO5015614010001',54,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3810-2LP33-5AA0',4,'SINAMICS GM150 IGBT Medium-voltage converters with DC link voltage and 12-pulse diode rectifier, degree of protection IP22, 3 AC 4.16 kV 2500 kVA, air-cooled','Product Delivery Release (P.M 300)',NULL,NULL),('N-V201417100016',50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6ES7141-3BH00-0XA0',1,'SIMATIC DP, Basic module BM 141 ET 200ECO: 16 DI 24 V DC; 8xM12, Duplicate assignment, Degree of protection IP65/67; Connection block 6ES7194-3AA00-0.A0 separately order','Announcement of Product Phaseout (P.M 400)','2002-06-01',16.986301369),('Q6U80352420009',44,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6RA7082-6FS22-0',4,'SIMOREG DC Master Converter,  with microprocessor for  single-quadrant drives B6C  connection input: 460V 3AC,  374A controllable: Field  rectifier D550/450 MRE-GEEF6S22  output: DC 550V, 450A Output  US-Rating: 500 V DC, 255A  Field-input. 460V-output. 375V,  25A','Product Cancellation (P.M 410)','2006-08-01',12.816438356),('Q6W73152420025',2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6RA7018-6DS22-0',4,'SIMOREG DC Master Converter, with microprocessor for single-quadrant drives B6C connection Input: 400V 3AC, 25A controllable: Field rectifier D485/30 MRE-GEE6S22 output: 485 V DC, 30 A Output US-Rating: 485 V DC, 25A Field-input. 400V-output. 325 V, 5 A','Product Cancellation (P.M 410)','2008-07-01',10.898630136),('Q6X20453420035',44,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6RA7031-6FV62-0',4,'SIMOREG DC Master Converter, with microprocessor for 4-quadrant drives Circuit (B6) A (B6) C input: 460V 3AC, 104A controllable: Field rectifier D480/125 MREQ-GEG6V62 output: DC 480V, 125 A Output US-Rating: 500 V DC, 100A Field-input. 460V-output. 375V, 10 A','Product Cancellation (P.M 410)','2009-02-01',10.309589041),('T-D808670902997 C',50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3352-1AE36-1EA1',4,'*Spare part* SINAMICS Replacement power block for 510-750 V DC, 605 A','Product Delivery Release (P.M 300)',NULL,NULL),('T-D80867090302 B',50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3352-1AE36-1CA1',4,'*Spare part* SINAMICS Replacement power block for 510-750 V DC, 605 A','Product Delivery Release (P.M 300)',NULL,NULL),('T-F72767000070',8,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3310-1TE32-6AA3',4,'SINAMICS S120 CONVERTER POWER MODULE 3AC 380-480V, 50/60HZ, 260A (132 KW) INTERNAL AIR COOLING FRAME SIZE: CHASSIS SUPPORT OF THE EXTENDED SAFETY INTEGRATED FUNCTIONS INCL. DRIVE-CLIQ CABLE AND MOUNTING PLATE FOR CU310','Product Delivery Release (P.M 300)','2009-07-16',9.857534246),('T-F72967000052',8,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3330-1TE41-5AA3',4,'SINAMICS S120 basic line module 380-480V 3AC, 50/60 Hz, 1500A Output: 510-650 V DC Type rating: 710kW Built-in unit IP00 design CIM Internal air cooling incl. Drive-CLiQ cable','Product Delivery Release (P.M 300)','2010-01-27',9.323287671),('T-J21111297',28,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SN1123-1AA00-0BA0',3,'SIMODRIVE 611 POWER MODULE, 1 AXIS, 25 A, INTERNAL COOLING, MOTOR RATED CURRENT: 1FT5 = 12.5 A, 1FT6 = 9 A, INDUCTION M. = 8A','Product Discontinuation (P.M 490)','2003-10-06',15.638356164),('T-K32025845',28,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SN1145-1AA01-0AA0',3,'SIMODRIVE 611 infeed module, 10/25 kW, uncontrolled, line contactor with NC contact','Product Discontinuation (P.M 490)','1998-03-01',21.24109589),('T-M92042153',28,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SN1123-1AA00-0BA1',3,'SIMODRIVE 611 POWER MODULE, 1 AXIS, 25 A, INTERNAL COOLING, MOTOR RATED CURRENT: 1FT5 = 12.5 A 1FT6 = 9 A, INDUCTION M. = 8 A','Product Discontinuation (P.M 490)','2000-09-01',18.734246575),('T-U12053161',28,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SN1118-0DM11-0AA1',3,'***SPARE PART*** SIMODRIVE 611-D PLUG-IN CLOSED-LOOP CONTROL UNIT, 2-AXES VERS., FOR DIGITAL DRIVE, FDD + MSD, W/O DIRECT MEASURING SYSTEM, STANDARD CLOSED-LOOP CONTROL','Product Cancellation (P.M 410)','2000-09-26',18.665753424),('W7189024654',50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SE6440-2AD31-8DA1',4,'MICROMASTER 440 WITH BUILT-IN CLASS A FILTER 3AC 380-480 V +10/-10% 47-63 HZ CONSTANT TORQUE POWER 18.5 KW OVERLOAD 150% 60 S, 200% 3 S SQUARED TORQUE POWER 22 KW 520 X 275 X 245 (H X W X D) PROTECTION IP20 AMBIENT TEMP. -10 TO +50 DEG. C WITHOUT AOP/BOP','Announcement of Product Phaseout (P.M 400)',NULL,NULL),('W7219024684',50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3224-0BE34-5UA0',4,'SINAMICS G120 POWER MODULE PM240 WITHOUT FILTER WITH BULT IN BRAKING CHOPPER 3AC380-480V +10/-10% 47-63HZ OUTPUT HIGH OVERLOAD: 45KW FOR 200% 3S,150% 57S,100% 240S AMBIENT TEMP -10 TO +50 DEG C OUTPUT LIGHT OVERLOAD: 55KW FOR 150% 3S,110% 57S,100% 240S AMBIENT TEMP -10 TO +40 DEG C 634 X 350 X 316 (HXWXD), FSF PROTECTION IP20 WITHOUT CONTROL UNIT AND BOP','Announcement of Product Phaseout (P.M 400)',NULL,NULL),('XAH115-002572',8,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3210-1SE13-1UA0',4,'SINAMICS S120 CONVERTER POWER MODULE PM340 INPUT: 3AC 380-480V, 50/60HZ OUTPUT: 3AC 3,1A (1,1KW) FRAME SIZE: BLOCKSIZE SIZE FSA INTERNAL AIR COOLING','Announcement of Product Phaseout (P.M 400)','2006-06-09',12.961643835),('XAW819-00593',48,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SE6420-2UC22-2BA1',4,'MICROMASTER 420 UNFILTERED 1/3AC 200-240V +10/-10% 47-63HZ CONSTANT TORQUE POWER 2.2 KW OVERLOAD 150% FOR 60S VARIABLE TORQUE POWER 2.2 KW 202 X 149 X 172 (H X W X D) PROTECTION IP20 AMBIENT TEMP -10 TO +50 DEG C W/O AOP/BOP','Announcement of Product Phaseout (P.M 400)','2003-02-15',16.276712328),('XE4300471286321001',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3710-3GJ33-1AS3',4,'SINAMICS G120ECP NEMA enclosed drive, AC/AC 3AC 460-480 V, 50/60 Hz nom. power rating: 250HP 18-pulse system without regenerative feedback version A, incl. EMC-Filter 2nd environment, category C3 meets IEEE519-1992  at the input power terminals','Product Delivery Release (P.M 300)',NULL,NULL),('XE4300471286321201',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'6SL3710-3GJ35-0AS3',4,'SINAMICS G120ECP NEMA enclosed drive, AC/AC 3AC 460-480 V, 50/60 Hz nom. power rating: 400HP 18-pulse system without regenerative feedback version A, incl. EMC-Filter 2nd environment, category C3 meets IEEE519-1992  at the input power terminals','Product Delivery Release (P.M 300)',NULL,NULL),('YF F3617 2125 01 001',50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'1PH8137-1DF13-2BA1',3,'SIMOTICS M Compact induction motor 1500rpm, 22kW, 140 Nm, 56A, 308V 1750rpm, 25kW, 136Nm, 56A, 353V 2000rpm, 28kW, 134Nm, 55A, 401V forced ventilation; direction of air flow NDE--> DE; Degree of protection IP55 INCREMENTAL ENCODER 22 BIT WITH COMMUTATING POSITION (ENCODER IC22DQ) WITH DRIVE-CLIQ INTERFACE DESIGN IM B35 (IM V15, IM V35) SHAFT WITH FITTED KEY HALF-KEY BALANCING BEARING: STANDARD WITH FIXED BEARING, VIBRATION SEVERITY GRADE: R/A, FLANGE ACCURACY: R TERMINAL BOX (ABOVE) CABLE ENTRY ON THE RIGHT SIGNAL CONNECTION D-END','Product Delivery Release (P.M 300)',NULL,NULL),('YF F4617 1818 01 001',50,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'1PH8107-1DF12-2BA1',3,'SIMOTICS M Compact induction motor 1500rpm, 9kW 57Nm, 23.5A, 330V 1750rpm, 10 kW 55Nm, 22A, 380 V 2000rpm, 11 kW 53Nm, 21.5A, 428V forced ventilation; direction of air flow NDE--> DE; Degree of protection IP55 INCREMENTAL ENCODER 22 BIT WITH COMMUTATING POSITION (ENCODER IC22DQ) WITH DRIVE-CLIQ INTERFACE DESIGN IM B5 (IMV 1,IM V3) SHAFT WITH FITTED KEY HALF-KEY BALANCING BEARING: STANDARD WITH FIXED BEARING, VIBRATION SEVERITY GRADE: R/A, SHAFT AND FLANGE ACCURACY: R TERMINAL BOX (ABOVE) CABLE ENTRY ON THE RIGHT SIGNAL CONNECTION D-END','Product Delivery Release (P.M 300)',NULL,NULL),('YFH2624640202001',8,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'1FK7042-2AF71-1CA2',3,'SIMOTICS S SIMOTICS S-1FK7 synchronous motor 1FK7-CT PN=0.82k UDC=600V M0=3Nm (100K); NN=3000rpm; naturally cooled design MB 5 (IM V1, IM V3) Flange 1 Power connector rotatable Absolute encoder 24-bit + 12-bit multiturn with DRIVE-CLiQ interface (encoder AM24DQI) shaft with feather key, tolerance N without holding brake, degree of protection IP65 DE Flange IP67','Product Delivery Release (P.M 300)','2019-01-25',0.323287671);
/*!40000 ALTER TABLE equipo ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table especialista
--

DROP TABLE IF EXISTS especialista;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE especialista (
  IdEspecialista int(20) NOT NULL,
  CeCo varchar(10) NOT NULL,
  NombreE varchar(50) NOT NULL,
  TarjetaIngresoArgos varchar(50) DEFAULT NULL,
  Celular varchar(10) NOT NULL,
  GID varchar(10) NOT NULL,
  CedulaCiudadania varchar(15) NOT NULL,
  LugarExpedicion varchar(20) NOT NULL,
  FechaNacimiento date NOT NULL,
  IdTecnica int(20) NOT NULL,
  Foto varchar(255) DEFAULT NULL,
  PRIMARY KEY (IdEspecialista),
  KEY Tecnica_Especialista (IdTecnica),
  CONSTRAINT Tecnica_Especialista FOREIGN KEY (IdTecnica) REFERENCES tecnica (IdTecnica) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table especialista
--

LOCK TABLES especialista WRITE;
/*!40000 ALTER TABLE especialista DISABLE KEYS */;
INSERT INTO especialista VALUES (1,'601503109','John Miltoni','','3012184422','Z0041MK','1032480886','Bogotá','1996-04-25',4,'C:\\Users\\Ingenieria\\Documents\\ServerTest\\images\\Foto_1.jpg'),(1007932,'60108022','Segundo Epifanio Holguin Gomez','FC 294','3118769362','Z000I1CX','3232726','Bogotá','1957-12-10',1,NULL),(1008382,'60108022','Carlos Eduardo Rodriguez Olave','FC 2 133','3124579014','Z0009NAR','19424115','Bogotá','1960-07-10',1,'C:\\Users\\Ingenieria\\Documents\\ServerTest\\images\\Foto_1008382.jpg'),(1011224,'60100614','Pedro Enrique Ramirez Pirajan','FC 296','3124579221','Z0009N5T','79446597','Bogotá','1967-07-25',2,'C:\\Users\\Ingenieria\\Documents\\ServerTest\\images\\Foto_1011224.jpg'),(1011800,'60150310','Fernando Bareño Rojas','FC 295','3124579220','Z000FTLD','79423592','Bogotá','1967-03-06',1,'C:\\Users\\Ingenieria\\Documents\\ServerTest\\images\\Foto_1011800.jpg'),(1014055,'60150310','Yezid Osbaldo Rincon Gonzalez','FC 2 128','3124579062','Z002MN1F','79890157','Bogotá','1978-10-24',1,'C:\\Users\\Ingenieria\\Documents\\ServerTest\\images\\Foto_1014055.jpg'),(1014112,'60100614','Edwin Andres Ortiz Gonzalez',NULL,'3212326554','Z002P0UT','86071235','Villavicencio','1982-02-22',2,NULL),(1014119,'60100614','Bernardo Antonio Roldan Agudelo','FC 2 118','3214908824','Z002PA0D','98578505','Bello','1970-04-11',1,'C:\\Users\\Ingenieria\\Documents\\ServerTest\\images\\Foto_1014119.jpg'),(1014482,'60150310','Fabian Eugenio Peña Devia','FC 2122','3124579206','Z002YZRH','80011341','Bogotá','1980-03-05',1,'C:\\Users\\Ingenieria\\Documents\\ServerTest\\images\\Foto_1014482.jpg'),(1014629,'60100614','Juan Carlos Nieto Zarate','FC 2 130','3102190842','Z0032N1D','79795954','Bogotá','1977-10-28',3,'C:\\Users\\Ingenieria\\Documents\\ServerTest\\images\\Foto_1014629.jpg'),(1015166,'60150310','Omar Blanco Morales','FC 2117','3208389379','Z003C84H','80111555','Bogotá','1983-11-16',1,NULL),(1015317,'60108022','Yesid Alfonso Vergel Herrera','FC 2117','3202755260','Z0030XUB','80870622','Bogotá','1984-09-14',1,'C:\\Users\\Ingenieria\\Documents\\ServerTest\\images\\Foto_1015317.jpg'),(1016136,'60100614','Hugo Fernando Guerrero Benitez','','3134615786','Z003w9uz','1010168010','Bogotá','1986-10-18',3,'C:\\Users\\Ingenieria\\Documents\\ServerTest\\images\\Foto_1016136.jpg'),(1016388,'60150310','Sebastian Salamanca Montoya','','3163285642','Z003W5AX','1116240796','Tuluá','1988-06-19',5,'C:\\Users\\Ingenieria\\Documents\\ServerTest\\images\\Foto_1016388.jpg'),(1191352,'60150310','Diego Alejandro Riveros Cañas',NULL,'3132345680','Z00343SJ','79997467','Bogotá','1981-08-21',4,NULL);
/*!40000 ALTER TABLE especialista ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table reportegeneral
--

DROP TABLE IF EXISTS reportegeneral;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE reportegeneral (
  Consecutivo varchar(50) NOT NULL,
  IdEmpresa int(2) NOT NULL,
  NombreContacto varchar(80) NOT NULL,
  NombreColaborador varchar(80) NOT NULL,
  NombreProyecto varchar(150) NOT NULL,
  DescripcionAlcance text NOT NULL,
  HojaTiempo json NOT NULL,
  Marca varchar(50) DEFAULT NULL,
  DenominacionInterna varchar(100) DEFAULT NULL,
  NumeroProducto varchar(40) NOT NULL,
  NumeroSerial varchar(25) DEFAULT NULL,
  CaracteristicasTecnicas varchar(125) NOT NULL,
  EstadoInicial varchar(255) NOT NULL,
  ActividadesRealizadas text NOT NULL,
  Conclusiones text NOT NULL,
  RepuestosSugeridos text NOT NULL,
  ActividadesPendientes text NOT NULL,
  FirmaEmisor text,
  FirmaCliente text,
  IdAsignacion int(20) NOT NULL,
  FechaEnvio date NOT NULL,
  Adjuntos json DEFAULT NULL,
  KEY Empresa_ReporteGeneral (IdEmpresa),
  KEY Asignacion_ReporteGeneral (IdAsignacion),
  CONSTRAINT Asignacion_ReporteGeneral FOREIGN KEY (IdAsignacion) REFERENCES asignacion (IdAsignacion) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT Empresa_ReporteGeneral FOREIGN KEY (IdEmpresa) REFERENCES empresa (IdEmpresa) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table reportegeneral
--

LOCK TABLES reportegeneral WRITE;
/*!40000 ALTER TABLE reportegeneral DISABLE KEYS */;
/*!40000 ALTER TABLE reportegeneral ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table status
--

DROP TABLE IF EXISTS status;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE status (
  IdStatus int(20) NOT NULL AUTO_INCREMENT,
  NombreS varchar(100) DEFAULT NULL,
  PRIMARY KEY (IdStatus)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table status
--

LOCK TABLES status WRITE;
/*!40000 ALTER TABLE status DISABLE KEYS */;
INSERT INTO status VALUES (1,'En Servicio'),(2,'Compensatorio'),(3,'Vacaciones'),(4,'Disponible'),(5,'Incapacidad'),(6,'Permiso'),(7,'Capacitación'),(8,'Disponible Fin de Semana');
/*!40000 ALTER TABLE status ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table tecnica
--

DROP TABLE IF EXISTS tecnica;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE tecnica (
  IdTecnica int(20) NOT NULL,
  NombreT varchar(5) DEFAULT NULL,
  CostoViaje int(10) NOT NULL,
  CostoServicio int(10) NOT NULL,
  PRIMARY KEY (IdTecnica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table tecnica
--

LOCK TABLES tecnica WRITE;
/*!40000 ALTER TABLE tecnica DISABLE KEYS */;
INSERT INTO tecnica VALUES (1,'VFD',196000,218000),(2,'BT',134000,146000),(3,'AUT',164000,179000),(4,'AOS',58000,65000),(5,'MOT',164000,179000);
/*!40000 ALTER TABLE tecnica ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table usuarioapp
--

DROP TABLE IF EXISTS usuarioapp;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE usuarioapp (
  CedulaCiudadania varchar(15) DEFAULT NULL,
  password varchar(255) DEFAULT NULL,
  subscription json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table usuarioapp
--

LOCK TABLES usuarioapp WRITE;
/*!40000 ALTER TABLE usuarioapp DISABLE KEYS */;
INSERT INTO usuarioapp VALUES ('1032480886','$2a$08$Jost3UIjpTzzhw1sWASOg.4YlSUdMTP/5WGOce9d3iad2yrpcF4cK',NULL);
/*!40000 ALTER TABLE usuarioapp ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table usuariodesktop
--

DROP TABLE IF EXISTS usuariodesktop;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE usuariodesktop (
  name varchar(100) NOT NULL,
  email varchar(100) DEFAULT NULL,
  password varchar(255) DEFAULT NULL,
  subscriptionToken json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table usuariodesktop
--

LOCK TABLES usuariodesktop WRITE;
/*!40000 ALTER TABLE usuariodesktop DISABLE KEYS */;
INSERT INTO usuariodesktop VALUES ('Juan Sebastian Diaz Guzman','juandiaz_guzman@siemens.com','$2a$08$rqpKIfqgti81Y2l2f.XzxOVr1EIc19mQA06LSAt00237kHHDXLPLu',NULL),('Diego Rodriguez','diego.rodriguez_chaparro@siemens.com','$2a$08$4fMB3nP7yTivU0X6QBJMgevu52U94GqKBF/MYOyF8OI4bODKoburW',NULL);
/*!40000 ALTER TABLE usuariodesktop ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-07-31 13:01:14
