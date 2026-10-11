const fs = require('fs')

const dashboard = fs.readFileSync('./public/dashboard.html', 'utf-8')
const river = fs.readFileSync('./public/river.html', 'utf-8')
const coverageMap = fs.readFileSync('./public/coverage-map.html', 'utf-8')
const smsGateway = fs.readFileSync('./public/sms-gateway.html', 'utf-8')
const farmerPortal = fs.readFileSync('./public/farmer-portal.html', 'utf-8')

exports.displayDashboard = (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(dashboard);
}

exports.displayRiver = (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(river);
}

exports.displayCoverageMap = (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(coverageMap);
}

exports.displaySmsGateway = (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(smsGateway);
}

exports.displayFarmerPortal = (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(farmerPortal);
}