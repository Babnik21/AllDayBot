import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, align } = format;
import { config } from "dotenv";
import moment from "moment-timezone";

// dotenv
config();

const myFormat = printf(({level, message, timestamp}) => {
    return `${timestamp} [${level}]  ${message}`;
});

const appendTimestamp = format((info, opts) => {
    if(opts.tz)
        info.timestamp = moment().tz(opts.tz).format();
    return info;
});

export const myLogger = (token) => {
    const logtail = new Logtail(token);
    return createLogger({
        level: "error",
        format: combine(appendTimestamp({ tz: 'Europe/Ljubljana' }), align(), myFormat),
        transports: [
            new transports.File({ filename: 'logs/debug.log', level: 'debug' })
        ],
        exceptionHandlers: [
            new transports.File({ filename: 'logs/exceptions.log' }),
            new LogtailTransport(logtail)
        ],
        rejectionHandlers: [
            new transports.File({ filename: 'logs/rejections.log'}),
            new LogtailTransport(logtail)
        ],
        exitOnError: false
    })
}

export let logger = myLogger(process.env.LOGGER_TOKEN.toString());
