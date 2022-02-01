const {createLogger, transports, format} = require('winston');

module.exports = createLogger({
  transports: [
    new transports.File({
      filename: 'logs/info.log',
      level: 'info',
      format: format.combine(format.timestamp(), format.json())
    })
  ]
});
