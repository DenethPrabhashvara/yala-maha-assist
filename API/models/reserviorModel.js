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
        result1 = await db.query(`SELECT * FROM reservoir_levels WHERE reservoir_id=$1 ORDER BY reading_date DESC`, [req.params.id])

        
        console.log(result1.rows)
         
        res.status(200).json(
            {
                status: "success",
                data: {
                        const : result.rows[0],  
                        latest: result1.rows[0]  //GET THE LATEST DATE UPDATED WATER LEVEL AND EVRYTHING
                }
            }
        )
    }
   catch(error){
    next(error)
   }
}


exports.getReslevels = async (req, res , next)=>{
    try{
        reslevel = await db.query(`SELECT * FROM reservoir_levels WHERE reservoir_id=$1 AND reading_date >= CURRENT_DATE - ($2 || 'days')::INTERVAL ORDER BY reading_date`, [req.params.id, req.query.days] )
        res.status(200).json(
            {
                status:"success",
                data: reslevel.rows
            }
        )
    } 
    catch(error){
        next(error)
    }
}   