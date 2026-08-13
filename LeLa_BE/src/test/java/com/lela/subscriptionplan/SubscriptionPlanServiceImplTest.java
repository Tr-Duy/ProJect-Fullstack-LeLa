package com.lela.subscriptionplan;

import com.lela.subscriptionplan.domain.SubscriptionPlan;
import com.lela.subscriptionplan.dto.SubscriptionPlanCreateRequest;
import com.lela.subscriptionplan.dto.SubscriptionPlanPatchRequest;
import com.lela.subscriptionplan.dto.SubscriptionPlanResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubscriptionPlanServiceImplTest {

    @Mock
    private SubscriptionPlanRepository repository;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private SubscriptionPlanServiceImpl service;

    private SubscriptionPlan entity;
    private SubscriptionPlanResponse response;

    @BeforeEach
    void setUp() {
        entity = new SubscriptionPlan();
        entity.setId(1L);
        entity.setPlanCode("PRO");
        entity.setName("Pro Plan");

        response = new SubscriptionPlanResponse();
        response.setId(1L);
        response.setPlanCode("PRO");
        response.setName("Pro Plan");
    }

    @Test
    void findAll_Success() {
        when(repository.findAll()).thenReturn(Arrays.asList(entity));
        when(modelMapper.map(entity, SubscriptionPlanResponse.class)).thenReturn(response);

        List<SubscriptionPlanResponse> result = service.findAll();

        assertEquals(1, result.size());
    }

    @Test
    void findById_Success() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(modelMapper.map(entity, SubscriptionPlanResponse.class)).thenReturn(response);

        Optional<SubscriptionPlanResponse> result = service.findById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void create_Success() {
        SubscriptionPlanCreateRequest request = new SubscriptionPlanCreateRequest();
        request.setPlanCode("PRO");

        when(modelMapper.map(request, SubscriptionPlan.class)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        when(modelMapper.map(entity, SubscriptionPlanResponse.class)).thenReturn(response);

        SubscriptionPlanResponse result = service.create(request);

        assertNotNull(result);
        verify(repository).save(entity);
    }

    @Test
    void patch_Success() {
        SubscriptionPlanPatchRequest request = new SubscriptionPlanPatchRequest();
        request.setName("Updated Plan");

        when(repository.findById(1L)).thenReturn(Optional.of(entity));
        when(repository.save(entity)).thenReturn(entity);
        when(modelMapper.map(entity, SubscriptionPlanResponse.class)).thenReturn(response);

        SubscriptionPlanResponse result = service.patch(1L, request);

        assertNotNull(result);
        assertEquals("Updated Plan", entity.getName());
        verify(repository).save(entity);
    }

    @Test
    void deleteById_Success() {
        service.deleteById(1L);
        verify(repository).deleteById(1L);
    }
}
