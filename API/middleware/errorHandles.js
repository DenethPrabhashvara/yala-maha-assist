
const errorHandle = (err,req, res, next) =>{
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            status: 'fail',
            message: 'Malformed JSON request body. Send phone and otp as quoted strings.'
        })
    }

    console.log(err.stack)
    res.status(500).json(
        {
            status: 500,
            message:"Internal Server Error",
            error  : err.message
        }
    )
}

module.exports = errorHandle