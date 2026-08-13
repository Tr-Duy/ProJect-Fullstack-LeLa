package com.lela.language;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.language.dto.LanguageCreateRequest;
import com.lela.language.dto.LanguagePatchRequest;
import com.lela.language.dto.LanguageResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.lela.auth.JwtService;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LanguageController.class)
@AutoConfigureMockMvc(addFilters = false)
public class LanguageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private LanguageService languageService;

    @MockitoBean
    private JwtService jwtService;

    private LanguageResponse languageResponse;

    @BeforeEach
    void setUp() {
        languageResponse = new LanguageResponse();
        languageResponse.setId(1L);
        languageResponse.setLanguageCode("en");
        languageResponse.setName("English");
        languageResponse.setNativeName("English");
        languageResponse.setFlagUrl("http://example.com/en.png");
        languageResponse.setIsActive(true);
    }

    @Test
    void findAll_Success() throws Exception {
        List<LanguageResponse> list = Arrays.asList(languageResponse);
        Mockito.when(languageService.findAll()).thenReturn(list);

        mockMvc.perform(get("/languages")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Lấy danh sách thành công"))
                .andExpect(jsonPath("$.data[0].id").value(1L))
                .andExpect(jsonPath("$.data[0].languageCode").value("en"));
    }

    @Test
    void findById_Success() throws Exception {
        Mockito.when(languageService.findById(1L)).thenReturn(Optional.of(languageResponse));

        mockMvc.perform(get("/languages/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Tìm thấy ngôn ngữ"))
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void findById_NotFound() throws Exception {
        Mockito.when(languageService.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/languages/99")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_Success() throws Exception {
        LanguageCreateRequest request = new LanguageCreateRequest();
        request.setLanguageCode("fr");
        request.setName("French");
        request.setNativeName("Français");
        request.setFlagUrl("http://example.com/fr.png");
        request.setIsActive(true);

        LanguageResponse createdResponse = new LanguageResponse();
        createdResponse.setId(2L);
        createdResponse.setLanguageCode("fr");
        createdResponse.setName("French");

        Mockito.when(languageService.create(any(LanguageCreateRequest.class))).thenReturn(createdResponse);

        mockMvc.perform(post("/languages")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Tạo ngôn ngữ thành công"))
                .andExpect(jsonPath("$.data.id").value(2L))
                .andExpect(jsonPath("$.data.languageCode").value("fr"));
    }

    @Test
    void patch_Success() throws Exception {
        LanguagePatchRequest request = new LanguagePatchRequest();
        request.setName("Updated English");

        LanguageResponse patchedResponse = new LanguageResponse();
        patchedResponse.setId(1L);
        patchedResponse.setLanguageCode("en");
        patchedResponse.setName("Updated English");

        Mockito.when(languageService.patch(eq(1L), any(LanguagePatchRequest.class))).thenReturn(patchedResponse);

        mockMvc.perform(patch("/languages/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật thành công"))
                .andExpect(jsonPath("$.data.name").value("Updated English"));
    }

    @Test
    void deleteById_Success() throws Exception {
        Mockito.doNothing().when(languageService).deleteById(1L);

        mockMvc.perform(delete("/languages/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa thành công"));
    }
}
