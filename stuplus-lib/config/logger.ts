import bunyan from "bunyan";
import seq from "bunyan-seq";
//logger initialization
let logger: bunyan;
const setLogger = async (name: string) => {
        logger = bunyan.createLogger({
            apiKey: process.env.SEQ_LOGGER_API_TOKEN,
            name: name,
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
}

export {
    setLogger,
    logger as default
};
