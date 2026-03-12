const pool = require('../db');
const fs = require('fs');
const path = require('path');
const pathFecha = path.join(__dirname, '../data/config_liga.json');


const getInitialData = async (req, res) => {

 
    const id_usuario = parseInt(req.params.id_usuario);

    try{

    if(id_usuario !== 1){
        return res.status(403).json({ message: "La petición está bloqueada para usuarios comunes" });
    }
        


        const [ligasRes] = await pool.query('SELECT COUNT(*) as total FROM liga');
        const [usuariosRes] = await pool.query('SELECT COUNT(*) as total FROM usuario');
        const [jornadaRes] = await pool.query('SELECT MAX(numero) as actual FROM jornada');

        const data = {
            totalLigas: ligasRes[0].total,
            totalUsuarios: usuariosRes[0].total,
            jornadaActualNumero: jornadaRes[0].actual || 0,
            fechaVirtual: getVirtualDate(), 
            mercadoAbierto: true     
        };

        res.json(data);


    } catch (error){
        console.error("Error en getInitialData Admin:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }   
}


const getVirtualDate = () => {
    if (!fs.existsSync(pathFecha)) {
        //Si no existe, lo creamos
        const inicial = { fecha: '2025-05-15' };
        fs.writeFileSync(pathFecha, JSON.stringify(inicial));
        return new Date(inicial.fecha);
    }
    const data = JSON.parse(fs.readFileSync(pathFecha));
    return new Date(data.fecha);
};



const saveVirtualDate = (nuevaFecha) => {
    const data = { fecha: nuevaFecha.toISOString().split('T')[0] };
    fs.writeFileSync(pathFecha, JSON.stringify(data));
};




const nextDay = async (req, res) => {
    try {
        let fechaActual = getVirtualDate();
        fechaActual.setDate(fechaActual.getDate() + 1); 
        
        saveVirtualDate(fechaActual);
        
        res.json({ 
            message: "Tiempo avanzado", 
            nuevaFecha: fechaActual.toISOString().split('T')[0] 
        });
    } catch (error) {
        res.status(500).json({ error: "No se pudo avanzar el tiempo" });
    }
};


module.exports = {
   getInitialData,
   getVirtualDate,
   nextDay
};