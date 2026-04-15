package com.eventsync.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.base-url}")
    private String baseUrl;

    /**
     * Sends an HTML invitation email with buttons.
     *
     * @param toEmail     Recipient email address
     * @param inviteeName Recipient's name
     * @param inviterName Name of the user who sent the invite
     * @param eventTitle  Title of the event
     * @param inviteId    The id of the EventMember record
     */
    public void sendInvitationEmail(String toEmail, String inviteeName, String inviterName, String eventTitle, Long inviteId) {
        log.info("=== EMAIL SERVICE CALLED ===");
        log.info("Sending invitation email TO: {}", toEmail);
        log.info("FROM: {}", fromEmail);
        log.info("Inviter: {}, Event: {}, Invite ID: {}", inviterName, eventTitle, inviteId);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("You've been invited to collaborate on: " + eventTitle);
            
            String acceptUrl = baseUrl + "/api/invitations/" + inviteId + "/accept?ngrok-skip-browser-warning=true";
            String rejectUrl = baseUrl + "/api/invitations/" + inviteId + "/reject?ngrok-skip-browser-warning=true";

            System.out.println("BASE URL: " + baseUrl);
            System.out.println("ACCEPT LINK: " + acceptUrl);

            String htmlContent = "<div style=\"font-family: Arial, sans-serif; padding: 20px; color: #333;\">" +
                "<h2>You're Invited!</h2>" +
                "<p>Hi <b>" + inviteeName + "</b>,</p>" +
                "<p><b>" + inviterName + "</b> has invited you to collaborate on the event:</p>" +
                "<h3 style=\"color: #0056b3;\">\"" + eventTitle + "\"</h3>" +
                "<p>Log in to EventSync to accept or decline the invitation.</p>" +
                "<div style=\"margin: 25px 0;\">" +
                "    <a href=\"" + acceptUrl + "\" style=\"background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 15px; display: inline-block;\">Accept Invitation</a>" +
                "    <a href=\"" + rejectUrl + "\" style=\"background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;\">Decline</a>" +
                "</div>" +
                "<p>— The EventSync Team</p>" +
                "</div>";

            helper.setText(htmlContent, true);

            log.info("Attempting to send an HTML email via JavaMailSender...");
            mailSender.send(message);
            log.info("SUCCESS: Email sent to {}", toEmail);

        } catch (Exception e) {
            // Logs the full exception so you can see exactly what failed
            log.error("FAILED to send email to {}: {}", toEmail, e.getMessage(), e);
        }
    }
}
