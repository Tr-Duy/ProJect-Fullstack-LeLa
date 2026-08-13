package com.lela.chat;

import com.lela.chat.domain.ChatConversation;
import com.lela.chat.domain.ChatMessage;
import com.lela.chat.domain.ConversationStatus;
import com.lela.chat.domain.SenderType;
import com.lela.chat.dto.ChatMessageResponse;
import com.lela.chat.dto.ConversationResponse;
import com.lela.chat.dto.GuestStartChatRequest;
import com.lela.chat.dto.SendMessageRequest;
import com.lela.common.exception.NotFoundExeception;
import com.lela.users.domain.Users;
import com.lela.users.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UsersRepository usersRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ModelMapper modelMapper;

    private Long getCurrentUserId() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return usersRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User không tồn tại"))
                .getId();
    }

    @Transactional
    public ConversationResponse startGuestChat(GuestStartChatRequest request) {
        String guestToken = UUID.randomUUID().toString();

        ChatConversation conversation = ChatConversation.builder()
                .guestToken(guestToken)
                .guestName(request.getGuestName())
                .guestEmail(request.getGuestEmail())
                .guestPhone(request.getGuestPhone())
                .guestDepartment(request.getGuestDepartment())
                .status(ConversationStatus.OPEN)
                .build();

        conversation = conversationRepository.save(conversation);

        ChatMessage initialMessage = ChatMessage.builder()
                .conversation(conversation)
                .senderType(SenderType.GUEST)
                .content(request.getMessage())
                .build();

        messageRepository.save(initialMessage);

        notifyAdminNewConversation();

        return mapToConversationResponse(conversation);
    }

    @Transactional
    public ConversationResponse startOrGetLearnerChat() {
        Long userId = getCurrentUserId();
        
        ChatConversation conversation = conversationRepository.findByUserIdAndStatus(userId, ConversationStatus.OPEN)
                .orElseGet(() -> {
                    Users user = usersRepository.findById(userId).orElseThrow();
                    ChatConversation newConv = ChatConversation.builder()
                            .user(user)
                            .status(ConversationStatus.OPEN)
                            .build();
                    ChatConversation saved = conversationRepository.save(newConv);
                    notifyAdminNewConversation();
                    return saved;
                });

        return mapToConversationResponse(conversation);
    }

    @Transactional
    public ChatMessageResponse sendMessage(SendMessageRequest request, SenderType senderType, Long senderId) {
        ChatConversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy hội thoại"));

        if (senderType == SenderType.GUEST) {
            if (request.getGuestToken() == null || !request.getGuestToken().equals(conversation.getGuestToken())) {
                throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Guest token không hợp lệ");
            }
        }

        if (senderType == SenderType.ADMIN) {
            if (conversation.getAssignedAdmin() == null) {
                Users admin = usersRepository.findById(senderId).orElseThrow();
                conversation.setAssignedAdmin(admin);
                conversationRepository.save(conversation);
            }
        } else {
            // Nếu người gửi không phải admin (Learner/Guest) và hội thoại đang đóng thì mở lại
            if (conversation.getStatus() == ConversationStatus.CLOSED) {
                conversation.setStatus(ConversationStatus.OPEN);
                conversationRepository.save(conversation);
                notifyAdminNewConversation();
            }
        }

        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .senderType(senderType)
                .senderId(senderId)
                .content(request.getContent())
                .build();

        message = messageRepository.save(message);

        ChatMessageResponse response = mapToMessageResponse(message);

        // Broadcast to specific conversation topic
        messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), response);

        return response;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getOpenConversations() {
        return conversationRepository.findByStatusOrderByUpdatedAtDesc(ConversationStatus.OPEN)
                .stream()
                .map(this::mapToConversationResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationResponse findConversationIdByGuestToken(String guestToken) {
        ChatConversation conversation = conversationRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy hội thoại"));
        return mapToConversationResponse(conversation);
    }

    @Transactional
    public void closeConversation(Long conversationId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NotFoundExeception("Không tìm thấy hội thoại"));
        conversation.setStatus(ConversationStatus.CLOSED);
        conversationRepository.save(conversation);
    }

    private void notifyAdminNewConversation() {
        messagingTemplate.convertAndSend("/topic/admin/conversations", "NEW_CONVERSATION");
    }

    private ChatMessageResponse mapToMessageResponse(ChatMessage entity) {
        ChatMessageResponse response = modelMapper.map(entity, ChatMessageResponse.class);
        response.setConversationId(entity.getConversation().getId());
        return response;
    }

    private ConversationResponse mapToConversationResponse(ChatConversation entity) {
        ConversationResponse response = modelMapper.map(entity, ConversationResponse.class);
        if (entity.getUser() != null) {
            response.setUserId(entity.getUser().getId());
            response.setUsername(entity.getUser().getUsername());
            response.setFullName(entity.getUser().getFullName());
        }
        if (entity.getAssignedAdmin() != null) {
            response.setAssignedAdminId(entity.getAssignedAdmin().getId());
        }
        
        ChatMessage lastMessage = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(entity.getId());
        if (lastMessage != null) {
            response.setLastMessage(mapToMessageResponse(lastMessage));
        }
        
        return response;
    }
}
