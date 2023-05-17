import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf } = format;


const myFormat = printf(({level, message, timestamp}) => {
    return `${timestamp} [${level}]  ${message}`;
});

export const testLogger = (token) => {
    const logtail = new Logtail(token);
    return createLogger({
        level: "debug",
        format: combine(timestamp(), myFormat),
        transports: [
            new transports.Console(),
            new transports.File({ filename: 'logs/test.log' }),
            new LogtailTransport(logtail)
        ]
    })
}
