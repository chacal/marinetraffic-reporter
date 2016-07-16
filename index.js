const AisEncode  = require ("ggencoder").AisEncode
const udpSocket = require('dgram').createSocket('udp4')
const request = require('request').defaults({json: true})

const MMSI = process.env.MMSI
const MARINETRAFFIC_IP = process.env.MARINETRAFFIC_IP
const MARINETRAFFIC_PORT = parseInt(process.env.MARINETRAFFIC_PORT)
const SIGNALK_API_URL = process.env.SIGNALK_API_URL


setInterval(getPositionAndReport, 10000)


function getPositionAndReport() {
  request(SIGNALK_API_URL + '/vessels/self/navigation', (err, res, navigation) => {
    if(err) {
      console.log('Error getting navigation data from SignalK server: ' + SIGNALK_API_URL)
    } else {
      var positionReportMgs = createPositionReportMessage(
        MMSI,
        navigation.position.latitude,
        navigation.position.longitude,
        mpsToKn(navigation.speedOverGround.value),
        radsToDeg(navigation.courseOverGroundTrue.value)
      )
      sendPositionReportMsg(positionReportMgs, MARINETRAFFIC_IP, MARINETRAFFIC_PORT)
    }
  })
}

function sendPositionReportMsg(msg, ip, port) {
  udpSocket.send(msg.nmea, 0, msg.nmea.length, port, ip, err => {
    if(err) {
      console.log('Failed to send position report.', err)
    } else {
      console.log('Position sent successfully!')
    }
    udpSocket.close()
  })
}


function createPositionReportMessage(mmsi, lat, lon, sog, cog) {
  console.log(`MMSI: ${mmsi} LAT: ${lat} LON: ${lon} SOG: ${sog} COG: ${cog}`)

  return new AisEncode ({
    aistype    : 18,     // class B position report
    repeat     : 0,
    mmsi       : mmsi,
    sog        : sog,
    accuracy   : 0,      // 0 = regular GPS, 1 = DGPS
    lon        : lon,
    lat        : lat,
    cog        : cog
  })
}

function radsToDeg(radians) { return radians * 180 / Math.PI }
function mpsToKn(mps) { return 1.9438444924574 * mps }