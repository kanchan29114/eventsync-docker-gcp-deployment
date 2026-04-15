import jakarta.mail.*;
import jakarta.mail.internet.*;
import java.util.Properties;

/**
 * Standalone Gmail SMTP test using jakarta.mail (Spring Boot 3.x compatible).
 *
 * Compile and run from the EventSync directory:
 *   javac -cp "C:\Users\HP\.m2\repository\org\eclipse\angus\jakarta.mail\2.0.3\jakarta.mail-2.0.3.jar" TestEmail.java
 *   java  -cp ".;C:\Users\HP\.m2\repository\org\eclipse\angus\jakarta.mail\2.0.3\jakarta.mail-2.0.3.jar;C:\Users\HP\.m2\repository\org\eclipse\angus\angus-activation\2.0.3\angus-activation-2.0.3.jar;C:\Users\HP\.m2\repository\jakarta\activation\jakarta.activation-api\2.1.3\jakarta.activation-api-2.1.3.jar" TestEmail
 */
public class TestEmail {

    public static void main(String[] args) throws Exception {
        final String gmailUser = "kanchanjadhav904@gmail.com";
        final String appPassword = "ecqesswdymippnvo"; // 16-char App Password, no spaces
        final String sendTo = "kanchanjadhav904@gmail.com";

        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.debug", "true"); // prints full SMTP handshake

        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(gmailUser, appPassword);
            }
        });

        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(gmailUser));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(sendTo));
        message.setSubject("EventSync SMTP Test");
        message.setText("Hello! This is a direct SMTP test from EventSync.");

        System.out.println("=== Sending email via Gmail SMTP ===");
        Transport.send(message);
        System.out.println("=== Email sent successfully! ===");
    }
}
