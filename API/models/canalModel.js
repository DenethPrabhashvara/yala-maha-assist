const db = require('../config/db.js')


// Canals farmers can pick as their water source, from the Mahaweli water issue schedule
// (Tank-Reserviour/add-cropcalendertodb.py loads it into water_issue_schedule).
// A canal has no location of its own, so it gets its scheme tank's: from mahawelitanks first,
// then from reservoirs by name. "Minneriya Left Bank Canal" takes Minneriya's.
// Tissawewa is left without one: the name fits both the Anuradhapura and the Hambantota tank.
exports.getCanals = async (req, res, next) =>{
    try{
        const result = await db.query(
            `SELECT DISTINCT ON (w.tank_name, w.section)
                    w.id, w.tank_name, w.section,
                    to_char(w.water_start, 'YYYY-MM-DD') AS water_start,
                    to_char(w.water_end, 'YYYY-MM-DD') AS water_end,
                    COALESCE(t.latitude, r.latitude) AS latitude,
                    COALESCE(t.longitude, r.longitude) AS longitude
             FROM water_issue_schedule w
             LEFT JOIN LATERAL (
                 SELECT latitude, longitude FROM mahawelitanks m
                 WHERE m.latitude IS NOT NULL
                   AND (lower(w.tank_name) = lower(m.tank_name) OR lower(w.tank_name) LIKE lower(m.tank_name) || ' %')
                 ORDER BY length(m.tank_name) DESC LIMIT 1
             ) t ON true
             LEFT JOIN LATERAL (
                 SELECT latitude, longitude FROM reservoirs x
                 WHERE lower(w.tank_name) <> 'tissawewa'
                   AND (lower(w.tank_name) = lower(x.name) OR lower(w.tank_name) LIKE lower(x.name) || ' %')
                 ORDER BY length(x.name) DESC LIMIT 1
             ) r ON true
             ORDER BY w.tank_name, w.section, w.water_start DESC`
        )

        res.status(200).json(
            {
                status: "success",
                data: result.rows.map(row => ({
                    id: row.id,
                    name: row.section ? `${row.tank_name} · ${row.section}` : `${row.tank_name} canals`,
                    scheme: row.tank_name,
                    section: row.section,
                    water_start: row.water_start,
                    water_end: row.water_end,
                    latitude: row.latitude,
                    longitude: row.longitude
                }))
            }
        )
    }
    catch(error){
        next(error)
    }
}
