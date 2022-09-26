import bunyan from "bunyan";
import seq from "bunyan-seq";
//logger initialization
var logger = bunyan.createLogger({
    apiKey: process.env.SEQ_LOGGER_API_TOKEN,
    name: 'Stuplus Cron',
    streams: [
        {
            stream: process.stdout,
            level: 'warn',
        },
        seq.createStream({
            serverUrl: process.env.SEQ_SERVER_URL,
            level: 'info'
        })
    ]
});

export default logger;
