package com.lela.chat;

import com.lela.chat.domain.SenderType;
import com.lela.chat.dto.ChatMessageResponse;
import com.lela.chat.dto.ConversationResponse;
import com.lela.chat.dto.GuestStartChatRequest;
import com.lela.chat.dto.SendMessageRequest;
import com.lela.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/guest/start")
    public ApiResponse<ConversationResponse> startGuestChat(@Valid @RequestBody GuestStartChatRequest request) {
        return ApiResponse.success(chatService.startGuestChat(request), "Bắt đầu chat với guest");
    }

    @PostMapping("/learner/start")
    @PreAuthorize("hasRole('LEARNER') or hasRole('ADMIN')")
    public ApiResponse<ConversationResponse> startLearnerChat() {
        return ApiResponse.success(chatService.startOrGetLearnerChat(), "Bắt đầu chat với learner");
    }

    @GetMapping("/conversations/{id}/messages")
    @PreAuthorize("hasRole('LEARNER') or hasRole('ADMIN')")
    public ApiResponse<List<ChatMessageResponse>> getMessages(@PathVariable Long id) {
        return ApiResponse.success(chatService.getMessages(id), "Lấy danh sách tin nhắn");
    }

    @GetMapping("/guest/{guestToken}/messages")
    public ApiResponse<List<ChatMessageResponse>> getGuestMessages(@PathVariable String guestToken) {
        ConversationResponse conversation = chatService.findConversationIdByGuestToken(guestToken);
        return ApiResponse.success(chatService.getMessages(conversation.getId()), "Lấy danh sách tin nhắn của guest");
    }

    @GetMapping("/guest/{guestToken}/conversation")
    public ApiResponse<ConversationResponse> getGuestConversation(@PathVariable String guestToken) {
        return ApiResponse.success(chatService.findConversationIdByGuestToken(guestToken), "Lấy thông tin cuộc hội thoại");
    }

    @GetMapping("/admin/conversations")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<ConversationResponse>> getOpenConversations() {
        return ApiResponse.success(chatService.getOpenConversations(), "Lấy danh sách hội thoại đang mở");
    }

    @PutMapping("/admin/conversations/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> closeConversation(@PathVariable Long id) {
        chatService.closeConversation(id);
        return ApiResponse.successMessage("Đã đóng cuộc hội thoại");
    }
}
