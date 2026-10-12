const db = require('../config/db.js')


exports.getAllResvData = async (req, res, next) =>{
     result =  await db.query('SELECT * FROM reservoirs ORDER BY id') //SORT BY Name if needed
     res.status(200).json(
        {
            status: "success",
            data: result.rows
        }
     )
}

exports.getALlreservior