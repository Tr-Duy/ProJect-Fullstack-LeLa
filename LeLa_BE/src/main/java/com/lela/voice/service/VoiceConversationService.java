package com.lela.voice.service;

import com.lela.users.domain.Users;
import com.lela.voice.dto.*;

import java.util.List;

public interface VoiceConversationService {

    VoiceStatusResponse getStatus(Users user);

    List<ConversationScenarioDto> getScenarios(Users user);

    VoiceStartResponse startSession(Users user, VoiceStartRequest req);

    VoiceTurnResponse processTurn(Users user, String publicId, VoiceTurnRequest req);

    VoiceReportResponse finishSession(Users user, String publicId, VoiceFinishRequest req);

    void abandonSession(Users user, String publicId);
}
