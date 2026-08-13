package com.lela.role;

import com.lela.common.exception.NotFoundExeception;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.lela.role.domain.Role;
import com.lela.role.dto.RoleCreateRequest;
import com.lela.role.dto.RolePatchRequest;
import com.lela.role.dto.RoleResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleServiceImpl implements RoleService {
    private final RoleRepository repository;
    private final ModelMapper modelMapper;

    @Override
    public List<RoleResponse> findAll() {
        // Lấy danh sách tất cả các vai trò và ánh xạ sang DTO
        return repository.findAll().stream()
                .map(e -> modelMapper.map(e, RoleResponse.class))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<RoleResponse> findById(Long id) {
        // Tìm vai trò theo ID và ánh xạ sang DTO nếu tìm thấy
        return repository.findById(id)
                .map(entity -> modelMapper.map(entity, RoleResponse.class));
    }

    @Override
    public RoleResponse create(RoleCreateRequest request) {
        // Ánh xạ request tạo mới sang thực thể Role
        Role entity = modelMapper.map(request, Role.class);
        entity = repository.save(entity);
        return modelMapper.map(entity, RoleResponse.class);
    }

    @Override
    public RoleResponse patch(Long id, RolePatchRequest request) {
        // Tìm kiếm thực thể hiện tại theo ID, ném ngoại lệ nếu không thấy
        Role entity = repository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Not found Role with id " + id));

        // Cập nhật các thuộc tính nếu khác null (Null-safe partial update)
        if (request.getRoleCode() != null)
            entity.setRoleCode(request.getRoleCode());
        if (request.getName() != null)
            entity.setName(request.getName());
        if (request.getDescription() != null)
            entity.setDescription(request.getDescription());
        if (request.getIsActive() != null)
            entity.setIsActive(request.getIsActive());

        entity = repository.save(entity);
        return modelMapper.map(entity, RoleResponse.class);
    }

    @Override
    public void deleteById(Long id) {
        // Thực hiện xóa thực thể khỏi DB
        repository.deleteById(id);
    }
}
