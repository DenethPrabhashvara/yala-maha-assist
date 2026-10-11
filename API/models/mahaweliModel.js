const db = require('../config/db.js')

exports.getAllTanks = async (req, res)=> {
    try{
    const result = await db.query("SELECT * FROM mahawelitanks")
    console.log(result.rows)
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
exports.getTankbyId = async (req,res, next)=>{
    try{
        const result = await db.query("SELECT * FROM mahawelitanks WHERE id = $1", [req.params.id])
        res.status(200).json(
            {
                status: "sucess",
                data: result.rows
            }
        )
    }
    catch(error){
        next(error)
    }
}