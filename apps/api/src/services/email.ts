import nodemailer from 'nodemailer'; import {env} from '../config/env';
const transport=nodemailer.createTransport({host:env.smtpHost,port:env.smtpPort,secure:false,auth:env.smtpUser?{user:env.smtpUser,pass:env.smtpPass}:undefined});
export async function sendEmail(to:string,subject:string,text:string){await transport.sendMail({from:env.smtpUser||'scheduler@example.com',to,subject,text});}
