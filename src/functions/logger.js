import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, align } = format;

const myFormat = printf(({level, message, timestamp}) => {
    return `${timestamp} [${level}]  ${message}`;
});

export const myLogger = (token) => {
    const logtail = new Logtail(token);
    return createLogger({
        level: "error",
        format: combine(timestamp(), align(), myFormat),
        transports: [
            new transports.File({ filename: 'logs/debug.log', level: 'debug' }),
            new LogtailTransport(logtail)
        ],
        exceptionHandlers: [
            new transports.File({ filename: 'logs/exceptions.log' })
        ],
        rejectionHandlers: [
            new transports.File({ filename: 'logs/rejections.log'})
        ],
        exitOnError: false
    })
}
