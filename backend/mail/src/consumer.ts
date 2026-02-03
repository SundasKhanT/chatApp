import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const startSendOTPConsumer = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.RABBITMQ_HOST,
      port: 5672,
      username: process.env.RABBITMQ_USERNAME,
      password: process.env.RABBITMQ_PASSWORD,
    });
    const channel = await connection.createChannel();
    const queueName = "send-OTP";

    await channel.assertQueue(queueName, { durable: true });
    console.log("Mail service consumer started and listening for OTP emails");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.PASSWORD,
      },
    });

    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          let content = msg.content.toString();
          let data = JSON.parse(content);

          if (typeof data === "string") {
            data = JSON.parse(data);
          }

          const { to, subject, body } = data;

          if (!to) {
            console.error(
              "❌ Recipient (to) is undefined. Check producer data format.",
            );
            return channel.ack(msg);
          }

          await transporter.sendMail({
            from: `"ChatApp" <${process.env.MAIL_USER}>`,
            to,
            subject: subject || "OTP Verification",
            text: body,
          });

          console.log(`✅ OTP mail sent to ${to}`);
          channel.ack(msg);
        } catch (error) {
          console.log("❌ Failed to send OTP:", error);
          channel.ack(msg);
        }
      }
    });
  } catch (error) {
    console.log("Failed to start RabbitMq consumer", error);
  }
};
