const db = require('../config/db.js')


// Rivers (basins) with their gauge stations and each station's latest reading,
// from the readings Tank-Reserviour/get-realtime-river-levels.py saves
exports.getRivers = async (req, res, next) =>{
    try{
        const result = await db.query(
            `SELECT DISTINCT ON (basin, station)
                    basin, station, latitude, longitude, water_level, rain_fall,
                    alertpull, minorpull, majorpull, creation_date
             FROM river_level_realtime
             WHERE basin IS NOT NULL AND station IS NOT NULL
             ORDER BY basin, station, creation_date DESC`
        )

        const rivers = []
        for (const row of result.rows) {
            let river = rivers[rivers.length - 1]
            if (!river || river.name !== row.basin) {
                river = { name: row.basin, stations: [] }
                rivers.push(river)
            }
            river.stations.push({
                name: row.station,
                latitude: row.latitude,
                longitude: row.longitude,
                water_level: row.water_level,
                rain_fall: row.rain_fall,
                alert_level: row.alertpull,
                minor_flood_level: row.minorpull,
                major_flood_level: row.majorpull,
                reading_at: row.creation_date
            })
        }

        res.status(200).json(
            {
                status: "success",
                data: rivers
            }
        )
    }
    catch(error){
        next(error)
    }
}
