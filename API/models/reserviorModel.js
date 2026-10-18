const db = require('../config/db.js')


exports.getAllResvData = async (req, res, next) =>{
    try{
        result =  await db.query('SELECT * FROM reservoirs ORDER BY id') //SORT BY Name if needed
        res.status(200).json(
            {
                status: "success",
                data: result.rows
            }
        )
    
    }
    catch(error){
        next(error)
    }
}

exports.getResById = async (req, res, next) =>{
    try{
        result = await db.query(`SELECT * FROM reservoirs WHERE id = $1;`, [req.params.id])

         
        res.status(200).json(
            {
                status: "success",
                data : result.rows[0]
            }
        )
    }
   catch(error){
    next(error)
   }
}


exports.getReslevels = (req, res , next)=>{
    reslevel = db.query('SELECT * FROM reservoir_levels')
}
