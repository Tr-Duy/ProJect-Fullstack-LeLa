package com.lela.tag;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lela.auth.JwtService;
import com.lela.tag.dto.TagRequest;
import com.lela.tag.dto.TagResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TagController.class)
@AutoConfigureMockMvc(addFilters = false)
public class TagControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TagService tagService;

    @MockitoBean
    private JwtService jwtService;

    private TagResponse tagResponse;

    @BeforeEach
    void setUp() {
        tagResponse = TagResponse.builder()
                .id(1L)
                .name("Programming")
                .slug("programming")
                .build();
    }

    @Test
    void createTag_Success() throws Exception {
        TagRequest request = new TagRequest();
        request.setName("Programming");

        Mockito.when(tagService.createTag(any(TagRequest.class))).thenReturn(tagResponse);

        mockMvc.perform(post("/tags")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Tạo Tag thành công"))
                .andExpect(jsonPath("$.data.id").value(1L))
                .andExpect(jsonPath("$.data.name").value("Programming"));
    }

    @Test
    void updateTag_Success() throws Exception {
        TagRequest request = new TagRequest();
        request.setName("Programming Updated");

        TagResponse updatedResponse = TagResponse.builder()
                .id(1L)
                .name("Programming Updated")
                .slug("programming-updated")
                .build();

        Mockito.when(tagService.updateTag(eq(1L), any(TagRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(patch("/tags/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật Tag thành công"))
                .andExpect(jsonPath("$.data.name").value("Programming Updated"));
    }

    @Test
    void getTagById_Success() throws Exception {
        Mockito.when(tagService.getTagById(1L)).thenReturn(tagResponse);

        mockMvc.perform(get("/tags/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Lấy thông tin Tag thành công"))
                .andExpect(jsonPath("$.data.id").value(1L));
    }

    @Test
    void getAllTags_Success() throws Exception {
        List<TagResponse> list = Arrays.asList(tagResponse);
        Page<TagResponse> page = new PageImpl<>(list);

        Mockito.when(tagService.getAllTags(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/tags")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Lấy danh sách Tag thành công"))
                .andExpect(jsonPath("$.data.content[0].id").value(1L));
    }

    @Test
    void deleteTag_Success() throws Exception {
        Mockito.doNothing().when(tagService).deleteTag(1L);

        mockMvc.perform(delete("/tags/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa Tag thành công"));
    }
}
