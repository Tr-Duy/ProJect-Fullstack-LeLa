package com.lela.chat;

import com.lela.chat.domain.SenderType;
import com.lela.chat.dto.SendMessageRequest;
import com.lela.users.UsersRepository;
import com.lela.users.domain.Users;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final UsersRepository usersRepository;

    @MessageMapping("/chat.guest.send")
    public void sendGuestMessage(@Payload SendMessageRequest request) {
        chatService.sendMessage(request, SenderType.GUEST, null);
    }

    @org.springframework.transaction.annotation.Transactional
    @MessageMapping("/chat.send")
    public void sendLearnerOrAdminMessage(@Payload SendMessageRequest request, Principal principal) {
        if (principal == null) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        
        Users user = usersRepository.findByUsername(principal.getName()).orElseThrow();
        boolean isAdmin = user.getRoleAssignments().stream()
                .anyMatch(role -> "ADMIN".equals(role.getRole().getRoleCode()));
        
        SenderType senderType = isAdmin ? SenderType.ADMIN : SenderType.LEARNER;
        chatService.sendMessage(request, senderType, user.getId());
    }
}
